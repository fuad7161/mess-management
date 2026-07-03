# Technical Design — API Spec, Database Schema, Project Structure

**Companion to:** `requirements.md`
**Stack:** React Native (Android) + Firebase (Auth, Firestore, Storage, Cloud Functions)

---

## 1. Architecture Overview

This is a **Firebase-native app**, not a traditional REST backend. That means two kinds of "API":

1. **Direct Firestore reads** — the app reads data straight from Firestore via the SDK, protected by Security Rules. No custom API needed for these (e.g., loading the meal sheet, dashboard numbers, bazar list).
2. **Cloud Functions (callable)** — used wherever an action needs **server-side validation, atomicity, or logic that touches multiple documents at once** (e.g., approving an entry, promoting an admin, calculating a bill). These are your real "API endpoints," called from the app like a function, not a URL.

Rule of thumb used below: **if it's just "show me data," use a direct Firestore listener. If it's "do something that changes state and has rules attached," use a Cloud Function.**

```
React Native App
   │
   ├── Firestore SDK (direct reads + simple own-document writes, governed by Security Rules)
   │
   └── Cloud Functions (callable) — for anything with business logic / atomicity / cross-document effects
            │
            └── Firestore (writes) + Storage (receipt uploads) + FCM (notifications)
```

---

## 2. Cloud Functions — API Specification

All functions below are **HTTPS Callable Functions** (`functions.https.onCall`), invoked from the app via the Firebase SDK (e.g., `httpsCallable(functions, 'joinGroup')`). Each entry shows: purpose, input, output, and the validation/business logic it must enforce server-side (never trust client-side checks alone, especially for the admin-gating and self-approval rules).

### 2.1 Auth & Profile

**`createUserProfile`**
- Trigger: called once right after Firebase Auth sign-up completes.
- Input: `{ name: string, photoUrl?: string }`
- Output: `{ success: true }`
- Logic: creates `users/{uid}` doc with `currentGroupId: null`.

---

### 2.2 Group Management

**`createGroup`**
- Input: `{ name: string, description?: string }`
- Output: `{ groupId: string }`
- Logic:
  - Reject if caller already has a `currentGroupId`.
  - Create `groups/{groupId}` with `createdBy: uid`, `adminCount: 1`, `memberCount: 1`.
  - Add caller to `groups/{groupId}/members/{uid}` with `role: "admin"`.
  - Set `users/{uid}.currentGroupId = groupId`.

**`searchGroups`**
- Input: `{ query: string }`
- Output: `{ groups: [{ groupId, name, memberCount }] }`
- Logic: prefix search on group name (Firestore doesn't do full-text search natively — use a lowercase `nameLower` field + range query, or Algolia/Typesense if search needs to be fuzzy later).

**`requestToJoinGroup`**
- Input: `{ groupId: string }`
- Output: `{ success: true }`
- Logic:
  - Reject if caller already has a pending request anywhere, or is already a member of a group with other members and hasn't gone through the leave flow (see 2.6 in requirements.md).
  - Create `groups/{groupId}/joinRequests/{uid}` with `status: "pending"`.

**`cancelJoinRequest`**
- Input: `{ groupId: string }`
- Output: `{ success: true }`
- Logic: deletes the pending request doc (only if it belongs to caller).

**`respondToJoinRequest`** *(admin only)*
- Input: `{ groupId: string, requestUid: string, decision: "approve" | "reject" }`
- Output: `{ success: true }`
- Logic (on approve):
  - Verify caller is an admin of `groupId`.
  - Check requester's current group (via `users/{requestUid}.currentGroupId`):
    - If they're the **sole admin of an empty group** → auto-delete/archive that old group (per requirements 2.6 Case A). *(In practice this should have been resolved client-side before the request was even allowed — see `requestToJoinGroup` — but re-verify here since state may have changed.)*
    - If they're in another group with members → this should already be blocked upstream; re-verify and reject the join if somehow still in that state.
    - If they're a plain member of another group → remove them from that group's `members` sub-collection (their historical entries stay untouched — just delink from active membership by setting `active: false`, don't hard-delete).
  - Add to `groups/{groupId}/members/{requestUid}` with `role: "member"`.
  - Update `users/{requestUid}.currentGroupId = groupId`.
  - Increment `groups/{groupId}.memberCount`.
  - Delete the join request doc.

**`promoteToAdmin`** *(admin only)*
- Input: `{ groupId: string, targetUid: string }`
- Output: `{ success: true }`
- Logic: set `members/{targetUid}.role = "admin"`, increment `groups/{groupId}.adminCount`.

**`demoteFromAdmin`** *(admin only)*
- Input: `{ groupId: string, targetUid: string }`
- Output: `{ success: true }`
- Logic: reject if `adminCount <= 1` (can't demote the last admin). Otherwise set role to `"member"`, decrement `adminCount`.

**`leaveGroup`**
- Input: `{ groupId: string }`
- Output: `{ success: true }`
- Logic:
  - If caller is an admin and `adminCount <= 1` and `memberCount > 1` → **reject** with error code explaining they must promote someone first (requirements 2.6 Case B).
  - If caller is an admin and is the only member (`memberCount === 1`) → allowed; this deletes/archives the group.
  - Otherwise: remove from `members`, decrement `memberCount` (and `adminCount` if they were an admin), clear `users/{uid}.currentGroupId`.

**`deleteGroup`** *(admin only)*
- Input: `{ groupId: string }`
- Output: `{ success: true }`
- Logic: soft-delete — set `groups/{groupId}.status = "deleted"`; clear `currentGroupId` for all remaining members.

**`updateMealWeights`** *(admin only)*
- Input: `{ groupId: string, breakfast: number, lunch: number, dinner: number }`
- Output: `{ success: true }`
- Logic: updates `groups/{groupId}.mealWeights`. Does **not** retroactively touch past `monthlySummary` docs (they hold their own `mealWeightsSnapshot`).

---

### 2.3 Meals

Meals are simple enough to be **direct Firestore writes from the client** (no Cloud Function needed) since there's no approval workflow — just enforce via Security Rules that a user can only write to their own `meals/{uid}_{date}` doc, and only within the current/recent month (e.g., block edits older than N days to prevent retroactive gaming of historical bills — decide the exact window).

Optional: **`setMealEntry`** callable if you want extra server-side validation (e.g., blocking edits to a finalized/locked month). Recommended once month-locking (2.4 formula section) is implemented.
- Input: `{ groupId, date, breakfast: bool, lunch: bool, dinner: bool, guestMeals?: number }`
- Output: `{ success: true }`
- Logic: reject if the month for `date` is already finalized (`monthlySummary.finalized === true`).

---

### 2.4 Bazar / Payment / Extra Cost (Expenses)

**`submitExpense`**
- Input: `{ groupId, type: "bazar" | "extraCost" | "payment", amount, date, note?, receiptUrl? }`
- Output: `{ expenseId: string }`
- Logic:
  - **Gate check: reject if `groups/{groupId}.adminCount < 2`** (requirements 2.4 — hard server-side enforcement, not just UI).
  - Create doc with `status: "pending"`, `submittedBy: uid`, `createdAt`.

**`approveExpense`** *(admin only)*
- Input: `{ groupId, expenseId, decision: "approve" | "reject" }`
- Output: `{ success: true }`
- Logic:
  - **Reject if `approverUid === submittedBy`** (no self-approval, applies to admins too — requirements 2.4).
  - Verify caller is an admin.
  - Set `status`, `approvedBy`, `approvedAt`.
  - Trigger recalculation (can be done here directly, or delegate to a Firestore `onUpdate` trigger — see 2.6 below; pick one place to avoid double-calculating).

**`manualExpenseEntry`** *(admin only)*
- Input: same as `submitExpense` plus `onBehalfOfUid: string`
- Output: `{ expenseId: string }`
- Logic: same as submitExpense but records `submittedBy: onBehalfOfUid`, `enteredByAdmin: callerUid`, and can be auto-approved immediately **only if `callerUid !== onBehalfOfUid`** (still respects no-self-approval if admin tries to manually enter their own bazar).

---

### 2.5 Calculation

**`getGroupSummary`** *(read-only, could also just be a direct Firestore read of `monthlySummary/{yyyy-mm}` — include as callable only if you want server-computed "live" numbers rather than trigger-updated ones)*
- Input: `{ groupId, month: "yyyy-mm" }`
- Output: `{ totalBazar, totalExtraCost, totalPayments, totalMeals, mealRate, perMemberBreakdown: {...}, finalized }`

**`finalizeMonth`** *(admin only)*
- Input: `{ groupId, month: "yyyy-mm" }`
- Output: `{ success: true }`
- Logic: locks `monthlySummary/{month}`, snapshots current `mealWeights` into it, sets `finalized: true`. Once finalized, no more meal/expense edits affecting that month are allowed (enforced in `setMealEntry` / expense functions by checking this flag).

---

### 2.6 Firestore Triggers (background functions, not called directly by the app)

**`onExpenseWrite`** — `functions.firestore.document('groups/{groupId}/expenses/{expenseId}').onWrite`
- Recomputes `monthlySummary/{yyyy-mm}` totals whenever an expense is created/updated/deleted, **but only if the affected month is not yet finalized**.

**`onMealWrite`** — same pattern for `meals/{uid}_{date}` docs — updates `totalMeals` and per-member meal counts in the relevant `monthlySummary`.

**`onPaymentWrite`** — same pattern for payment docs.

*(These three could be consolidated into one function watching a shared `expenses` collection with a `type` field, as modeled in the schema below — simpler than three near-duplicate functions.)*

---

## 3. Firestore Database Schema (Full)

```
users/{uid}
  - name: string
  - phone: string
  - photoUrl: string | null
  - currentGroupId: string | null
  - createdAt: timestamp

groups/{groupId}
  - name: string
  - nameLower: string              // for prefix search
  - description: string | null
  - createdBy: uid
  - createdAt: timestamp
  - status: "active" | "deleted"
  - adminCount: number             // denormalized, gates entry creation (see API 2.4)
  - memberCount: number            // denormalized
  - mealWeights: { breakfast: number, lunch: number, dinner: number }

groups/{groupId}/members/{uid}
  - role: "admin" | "member"
  - joinedAt: timestamp
  - active: boolean                // false if they've left but history is retained

groups/{groupId}/joinRequests/{uid}
  - requestedAt: timestamp
  - status: "pending" | "approved" | "rejected"

groups/{groupId}/meals/{uid}_{yyyy-mm-dd}
  - uid: string
  - date: string (yyyy-mm-dd)
  - breakfast: boolean
  - lunch: boolean
  - dinner: boolean
  - guestMeals: number             // extra meal units, added at full weight or a configurable guest weight
  - weightsUsedSnapshot: { breakfast, lunch, dinner }  // captured at write time for audit safety

groups/{groupId}/expenses/{expenseId}
  - type: "bazar" | "extraCost"
  - submittedBy: uid
  - amount: number
  - date: string (yyyy-mm-dd)
  - note: string | null
  - receiptUrl: string | null      // Firebase Storage path, bazar only, optional
  - status: "pending" | "approved" | "rejected"
  - approvedBy: uid | null
  - approvedAt: timestamp | null
  - enteredByAdmin: uid | null     // set only for manual entries
  - createdAt: timestamp

groups/{groupId}/payments/{paymentId}
  - submittedBy: uid
  - amount: number
  - date: string
  - method: string | null          // cash / bKash / Nagad / bank / other
  - note: string | null
  - status: "pending" | "approved" | "rejected"
  - approvedBy: uid | null
  - approvedAt: timestamp | null
  - createdAt: timestamp

groups/{groupId}/monthlySummary/{yyyy-mm}
  - totalBazar: number
  - totalExtraCost: number
  - totalPayments: number
  - totalMeals: number
  - mealRate: number
  - extraCostPerMember: number
  - perMemberBreakdown: {
      [uid]: { meals: number, bazarCost: number, extraCost: number, paid: number, due: number }
    }
  - memberCountForExtraCost: number   // includes members who left mid-month (requirements section 6)
  - mealWeightsSnapshot: { breakfast, lunch, dinner }
  - finalized: boolean
  - finalizedAt: timestamp | null
  - finalizedBy: uid | null
```

### Recommended Composite Indexes
- `expenses`: `(groupId, type, status, date)` — for sheet filtering by type + verification status.
- `expenses`: `(groupId, submittedBy, date)` — for "my entries" filtering.
- `meals`: `(groupId, date)` — for building the meal sheet table per day.
- `payments`: `(groupId, submittedBy, date)`.

### Firebase Storage Structure
```
/receipts/{groupId}/{expenseId}/{filename}
```
Security rule: only the uploader or a group admin can read/write within a given `groupId` path.

---

## 4. React Native Project Structure

```
mess-app/
├── android/                          # native Android project (RN default)
├── src/
│   ├── api/                          # thin wrappers around Firebase calls
│   │   ├── firebase.ts               # Firebase app init (Auth, Firestore, Storage, Functions)
│   │   ├── authApi.ts
│   │   ├── groupApi.ts               # createGroup, joinGroup, promote/demote, leaveGroup...
│   │   ├── mealApi.ts
│   │   ├── expenseApi.ts             # bazar + extraCost + payment submit/approve calls
│   │   └── summaryApi.ts
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OtpVerifyScreen.tsx
│   │   ├── onboarding/
│   │   │   ├── NoGroupScreen.tsx     # State A/B from requirements 1.1
│   │   │   ├── SearchGroupScreen.tsx
│   │   │   └── CreateGroupScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── meals/
│   │   │   ├── MealSheetScreen.tsx
│   │   │   └── MealCalendarScreen.tsx
│   │   ├── bazar/
│   │   │   ├── BazarSheetScreen.tsx
│   │   │   └── BazarEntryFormScreen.tsx
│   │   ├── payments/
│   │   │   ├── PaymentSheetScreen.tsx
│   │   │   └── PaymentEntryFormScreen.tsx
│   │   ├── extraCost/
│   │   │   ├── ExtraCostSheetScreen.tsx
│   │   │   └── ExtraCostEntryFormScreen.tsx
│   │   └── group/
│   │       ├── GroupSettingsScreen.tsx     # meal weights, delete group
│   │       ├── MemberManagementScreen.tsx  # promote/demote, view members
│   │       └── JoinRequestsScreen.tsx      # admin approval queue
│   │
│   ├── components/
│   │   ├── common/                   # buttons, cards, warning banners, loaders
│   │   ├── sheets/                   # shared table/spreadsheet-style component used by all 3 sheets
│   │   └── entries/                  # entry list item, status tag (verified/pending/rejected)
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # switches between Auth / Onboarding / MainTabs based on state
│   │   ├── MainTabNavigator.tsx      # the 5 bottom tabs
│   │   └── types.ts
│   │
│   ├── store/                        # state management (Zustand or Redux Toolkit)
│   │   ├── authStore.ts
│   │   ├── groupStore.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useGroupListener.ts       # Firestore onSnapshot wrappers
│   │   ├── useMealSheet.ts
│   │   ├── useExpenseSheet.ts
│   │   └── useMonthlySummary.ts
│   │
│   ├── utils/
│   │   ├── dateHelpers.ts
│   │   ├── calculations.ts           # client-side preview calc (mirrors Cloud Function logic for instant UI feedback)
│   │   └── validators.ts
│   │
│   └── types/
│       ├── group.ts
│       ├── expense.ts
│       ├── meal.ts
│       └── user.ts
│
├── functions/                        # Firebase Cloud Functions (separate Node/TS project)
│   ├── src/
│   │   ├── index.ts                  # exports all functions
│   │   ├── group/
│   │   │   ├── createGroup.ts
│   │   │   ├── joinRequest.ts
│   │   │   ├── promoteDemote.ts
│   │   │   └── leaveDeleteGroup.ts
│   │   ├── expense/
│   │   │   ├── submitExpense.ts
│   │   │   ├── approveExpense.ts
│   │   │   └── manualEntry.ts
│   │   ├── triggers/
│   │   │   ├── onExpenseWrite.ts
│   │   │   ├── onMealWrite.ts
│   │   │   └── onPaymentWrite.ts
│   │   ├── summary/
│   │   │   ├── getGroupSummary.ts
│   │   │   └── finalizeMonth.ts
│   │   └── shared/
│   │       ├── calculations.ts       # single source of truth for formulas, imported by triggers + summary functions
│   │       └── validators.ts         # admin-check, self-approval-check, gating-check helpers
│   ├── package.json
│   └── tsconfig.json
│
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── package.json
```

### Key technical decisions worth locking in early
- **State management:** Zustand is lighter than Redux Toolkit and fits well here since most "state" is really just Firestore listeners feeding local state — you don't need heavy global state machinery.
- **Navigation:** React Navigation, with a top-level switch in `RootNavigator` based on three states: not logged in → `AuthStack`; logged in but no group → `OnboardingStack`; logged in with group → `MainTabNavigator`.
- **Calculation logic duplication:** keep `calculations.ts` logic identical (or literally shared, if you set up a shared package) between the Cloud Functions and the app's local preview calculations, so the "live" number a member sees before submitting matches what the server eventually computes.
- **Form library:** React Hook Form pairs well with RN for the multiple entry forms (bazar, payment, extra cost all share similar shape).
- **Image upload:** compress receipt photos client-side (e.g., `react-native-image-resizer`) before upload to keep Storage costs and load times down — receipts don't need to be full resolution.

---

## 5. Suggested Build Order Alignment

This maps directly onto the Phase breakdown in `requirements.md`:
- Phase 1–2 (Foundation + Group logic) → build `functions/src/group/*` first, since almost everything else depends on group state and the admin-gating rule.
- Phase 3 (Meals) → mostly client-side + `onMealWrite` trigger.
- Phase 4–5 (Bazar/Payment/Extra Cost) → `functions/src/expense/*` + the shared `sheets/` component in the app (build the table component once, reuse for all three sheets since they're structurally identical).
- Phase 6 (Calculation engine) → `functions/src/triggers/*` and `functions/src/summary/*`, built against the shared `calculations.ts`.
