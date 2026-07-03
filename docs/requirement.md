# Mess Meal Management System — Requirements Document

**Stack:** Android (React Native), Firebase (Auth, Firestore, Storage, Cloud Functions)
**Scope:** Single mess per user at a time, group-based, admin-approval workflow

---

## 1. User & Auth

- Firebase Auth with Phone OTP.
- A user can belong to **exactly one group at a time**.
- User profile: name, phone number, photo (optional), UID.

### 1.1 No-Group State (Onboarding Screen)
If `user.currentGroupId` is null, the user does **not** see the 5-tab app shell at all (tabs stay hidden/locked, not just grayed out). Instead they land on a dedicated onboarding screen with one of two states:

**State A — No pending request:**
- Search bar to find a group by name
- "Request to Join" button on search results
- "Create New Group" button

**State B — Pending join request exists:**
- Instead of the search UI, show a status card: *"Request to join [Group Name] — Pending approval"*
- "Cancel Request" option to withdraw and return to State A

Once the join request is approved (or a group is created), this screen is replaced permanently by the 5-tab main app.

---

## 2. Group Management

### 2.1 Group Creation
- Any user can create a group (mess name, optional description/location).
- Creator becomes the **default admin**.

### 2.2 Join Flow
- User searches for a group by name.
- User sends a **join request**.
- Any current admin of the group can **approve or reject** the request.
- On approval:
  - User is added to `groupId/members`.
  - If the user was previously in another group, they are **removed from that group** (see 2.7).

### 2.3 Admin Rules
- A group can have **multiple admins**.
- Any admin can promote another member to admin.
- Any admin can demote another admin (including the original creator) back to member — **as long as at least 1 admin remains in the group**.
- Admins **cannot leave** the group. To exit, an admin must:
  - First be demoted to a regular member by another admin, **or**
  - Delete the group entirely (if they are the sole admin — see 2.5).
- Regular members **can leave** the group freely.

### 2.4 Minimum Group Activation Requirement (No Self-Approval Problem)
Since **no one can approve their own entry** (not even an admin), a group must have **at least 2 admins** before any entry requiring approval can function. To avoid deadlocks and orphaned pending entries, the app enforces this at the group level:

- A newly created group starts with exactly **1 admin (the creator) and 0 other members**.
- Until the group has **at least 2 members**, the group is in a **"Setup" state**:
  - No Bazar, Payment, or Extra Cost entries can be created by anyone (creation is blocked, not just approval).
  - The creator sees a persistent warning banner: *"Add at least one more member to activate this group."*
  - Meal toggles may still be used (no approval needed for meals), but rate calculations are meaningless with 1 member, so this is a minor/cosmetic allowance.
- Once a **second member joins**, the group is still **not fully active** until the creator **promotes that second member to admin**. The app shows a follow-up banner: *"Promote a member to admin so entries can be verified."*
- Only once the group has **≥ 2 admins** does entry creation (Bazar, Payment, Extra Cost) unlock for everyone in the group.
- This rule permanently applies going forward too — if a group ever drops back down to 1 admin (e.g., a demotion edge case, which normally shouldn't happen per 2.3's "at least 1 admin" floor, but could happen if the only other admin leaves the group entirely), entry creation locks again until a 2nd admin exists.

This removes the need for any "self-approval" exception — the app simply won't let approval-requiring entries exist until there are enough admins to review them.

### 2.5 Group Deletion
- Only an admin can delete a group.
- Deleting a group is irreversible (archives or hard-deletes all sub-data — decide at build time; recommend soft-delete/archive for safety).

### 2.6 Admin Attempting to Join Another Group
An admin cannot simply abandon their current group by joining another — this could orphan the group or its members. The behavior depends on group size:

**Case A — Admin's current group has no other members (solo group):**
- Joining a new group triggers a confirmation dialog: *"You're the only member of [Group Name]. Joining a new group will delete it. Continue?"*
- On confirmation, the old (empty) group is deleted/archived and the join proceeds normally.

**Case B — Admin's current group has other members:**
- The join request to the new group is **blocked** with a message: *"You must promote another member to admin before leaving this group."*
- The member list is shown inline so the admin can promote someone immediately.
- Once at least one other admin exists in the group, the original admin is **automatically demoted to a regular member** (reusing the existing demotion rule in 2.3), and they are now free to leave and join the new group.

### 2.7 Member Switching Groups
- One member = one active group at a time.
- If a member is accepted into a new group while already in an old one:
  - They are auto-removed from the old group's active member list.
  - **All their historical entries (meals, bazar, payments) remain in the old group, frozen.**
  - Their unpaid dues in the old group are **not auto-settled** — old-group admin handles this manually (outside the app, or via manual adjustment entry).
  - While outside a group, no one can edit that member's old records except admin actions already allowed (approve/reject their pending bazar/payment).
  - If the member later rejoins the same old group, they regain visibility of their historical data and can resume actions.

---

## 3. Meal Management

- Three meal slots per day per member: **Breakfast, Lunch, Dinner**.
- Default meal weights (admin-editable per group):
  | Meal | Default Value |
  |------|---------------|
  | Breakfast | 0.5 |
  | Lunch | 1.0 |
  | Dinner | 1.0 |
- Each member toggles their own meals on/off per day per slot.
- Admin can modify the weight values for the group (affects future calculations; past months should **lock** their weight-at-the-time to avoid retroactively changing historical bills — store the weight used per entry or snapshot it monthly).
- Calendar view per member showing daily meal status.
- **Meal Sheet tab**: shows all members' meal entries in a table (date × member), filterable by person.

### Formula — Member's Total Meals (for a given month)
```
member_total_meals = Σ (breakfast_flag × breakfast_weight + lunch_flag × lunch_weight + dinner_flag × dinner_weight)
                      for each day in the month
```
(flags are 0 or 1; guest meals, if added, are added as extra meal units to the member who hosted them)

---

## 4. Bazar / Expense Entry

*(Renaming suggestion: call this module "**Bazar**" in UI for local familiarity, but store internally as `expenses` collection with `type: bazar`.)*

> ⚠️ Entry creation here is only enabled once the group has **≥ 2 admins** (see 2.4). Before that, this tab shows the activation warning instead of the entry form.

- **Any group member** can submit a bazar entry: date, amount, item list (optional), receipt photo (optional, uploaded to Firebase Storage).
- Every bazar entry starts as `status: pending`.
- **An admin must approve** the entry before it counts toward the final calculation.
- Rejected entries are marked `status: rejected` and excluded, but remain visible in the sheet for transparency.
- **Bazar Sheet tab**: spreadsheet-style view — Date | Member | Amount | Status. Filterable by member/date. Unapproved entries appear with a ⚠️ "Not Verified" warning tag but are still listed (not hidden).
- Manual entry option (for admin to log a bazar entry on someone else's behalf, e.g., cash handed over, no app-record originally).

### Formula — Monthly Meal Rate
```
monthly_meal_rate = total_approved_bazar_amount_for_month / total_group_meals_for_month
```
Only `status: approved` bazar entries count. Displayed live/on-demand, recalculated anytime an approval status changes.

---

## 5. Payment Log

> ⚠️ Same **≥ 2 admins** gating rule from 2.4 applies here.

- Members manually log a payment (amount, date, method, optional note).
- Entry starts as `status: pending`.
- Admin approves (confirms receipt) or rejects.
- **Payment Sheet tab**: same spreadsheet style — Date | Member | Amount | Status. Filterable. Unverified entries shown with warning tag.
- Only `status: approved` payments count toward a member's paid total.

---

## 6. Extra Cost (Fixed/Utility Costs)

> ⚠️ Same **≥ 2 admins** gating rule from 2.4 applies here.

- Separate from Bazar. Examples: current (electricity) bill, WiFi bill, khala (helper) bill, gas, etc.
- Entered by admin (or member, admin-approved — recommend same approval flow as bazar for consistency).
- Khala bill typically entered once at month-end.
- **No individual deposits against this** — it's a pure cost line, split among members.
- **Extra Cost Sheet tab**: same spreadsheet style as bazar/payment sheets.
- **Important rule**: if a member leaves the group mid-month, they are **still included** in the extra-cost split for that month (since they have historical presence/history for that period).

### Formula — Extra Cost Per Member
```
extra_cost_per_member = total_approved_extra_cost_for_month / total_members_counted_for_month
```
`total_members_counted_for_month` = count of all members who were part of the group at any point during that month (including those who left), not just currently active members.

---

## 7. Final Monthly Bill Calculation

### Per-Member Final Due
```
member_bill = (member_total_meals × monthly_meal_rate)
              + extra_cost_per_member
              − member_total_approved_payments

If member_bill > 0  → member owes this amount (Due)
If member_bill < 0  → member is in credit (Advance carried forward, optional feature)
```

### Group-Level Totals (shown on Dashboard)
```
total_bazar_amount   = Σ approved bazar entries for the month
total_extra_cost     = Σ approved extra cost entries for the month
total_payment_amount = Σ approved payments for the month
current_meal_rate    = total_bazar_amount / total_group_meals_so_far
```

This should be **live/real-time** — recalculated on every relevant approval, not just once at month-end. A Cloud Function (or client-side calculation using Firestore listeners) keeps this current so members can check "current standing" any time mid-month, not just after finalization.

### Month Finalization (optional but recommended)
- Admin can "close" a month once satisfied all entries are settled.
- Locks meal weight values, meal rate, and bill amounts for that month as historical record (prevents future weight changes from retroactively altering old months).

---

## 8. App Structure — 5 Tabs

| Tab | Purpose |
|---|---|
| **Dashboard** | Current month meal rate, total bazar, total payments, total extra cost, member list with individual due/advance status |
| **Meal Sheet** | All members' meal entries in table form; filter by member; each user can drill into only their own detailed entry for editing (view of others is read-only, current-status only) |
| **Bazar Sheet** | Excel-style table: Date, Member, Amount, Status (verified/not verified), receipt link if any; filter + manual entry |
| **Payment Sheet** | Same structure as Bazar Sheet, for payments |
| **Extra Cost Sheet** | Same structure, for fixed/utility costs |

**Visibility rule:** Any member can see the group's aggregate sheets (bazar/payment/extra cost — this is standard for mess transparency), but **individual detailed meal entries editing is restricted to the entry owner**; others can view but not modify. Confirm this matches your intent — you mentioned "anyone can only just able to see a specific person data" which suggests filtering view to one person at a time, not necessarily restricting visibility of the group. Recommend: **all members can view all data (read), but only the entry owner or an admin can edit/delete an entry.**

---

## 9. Firestore Data Structure (Draft)

```
users/{uid}
  - name, phone, photoUrl, currentGroupId

groups/{groupId}
  - name, createdBy, createdAt, mealWeights: { breakfast: 0.5, lunch: 1, dinner: 1 }
  - status: "active" | "deleted"
  - adminCount: number (denormalized counter, updated on promote/demote — used to gate entry creation, see 2.4)
  - memberCount: number (denormalized counter)

groups/{groupId}/members/{uid}
  - role: "admin" | "member", joinedAt, active: true/false

groups/{groupId}/joinRequests/{uid}
  - requestedAt, status: pending/approved/rejected

groups/{groupId}/meals/{uid}_{date}
  - uid, date, breakfast: bool, lunch: bool, dinner: bool, guestMeals: number

groups/{groupId}/expenses/{expenseId}
  - type: "bazar" | "extraCost"
  - uid (submitted by), amount, date, note, receiptUrl (optional), status: pending/approved/rejected, approvedBy, approvedAt

groups/{groupId}/payments/{paymentId}
  - uid, amount, date, method, note, status: pending/approved/rejected, approvedBy

groups/{groupId}/monthlySummary/{yyyy-mm}
  - totalBazar, totalExtraCost, totalPayments, totalMeals, mealRate, perMemberBreakdown: {}, finalized: bool, mealWeightsSnapshot
```

---

## 10. Non-Functional Requirements

- Real-time sync via Firestore listeners (esp. for Dashboard and sheets).
- Offline support — Firestore's built-in offline persistence should be enabled (important for spotty hostel wifi).
- Firestore Security Rules:
  - Only group members can read group sub-collections.
  - Only admins can approve/reject entries, manage members, modify meal weights, delete group.
  - Users can only edit their own meal/bazar/payment entries (before approval).
  - Once approved/rejected, entries become immutable to regular members (only admin can reverse via explicit "un-approve" action, logged).
  - **Reject creation of any Bazar/Payment/Extra Cost document if `group.adminCount < 2`** (server-side enforcement of the activation gate in 2.4, not just a UI-level block).
  - **Reject approval where `approvedBy == uid` of the entry's own submitter** (server-side enforcement of "no self-approval," covering admins too).
- Audit trail: store `approvedBy`, `approvedAt`, `createdBy` on all financial entries — disputes are common with shared money.
- Cloud Functions:
  - Recalculate monthly summary on any approval/edit/delete of meal, bazar, extra-cost, or payment doc (trigger-based).
  - Monthly close/lock function.

---

## 11. Open Items to Decide Later (Not Blocking v1)

- Whether "un-approve" (reverting an approved entry) should be allowed, and if it should trigger recalculation + notification to affected member.
- Whether advance/credit balances should carry forward automatically to next month or reset to zero at month close.
- Whether guest meals need their own approval flow or are self-reported alongside personal meals.
- What happens if the group drops from 2 admins back to 1 (e.g., the 2nd admin leaves the group entirely rather than being demoted) — should existing pending entries stay pending until a 2nd admin returns, or should the sole remaining admin be forced to promote someone immediately?

---

# To-Do List with Estimation

*Estimates assume one developer, working part-time alongside job (adjust if full-time). "Day" = focused 4–6 hr session.*

## Phase 1: Foundation (4–5 days)
- [ ] Firebase project setup, Auth (Phone OTP) — **1 day**
- [ ] Firestore schema setup + security rules v1 — **1 day**
- [ ] Basic navigation shell (5 tabs, bottom nav, blank/onboarding state) — **1 day**
- [ ] User profile screen — **0.5 day**
- [ ] Group search + create + join request UI — **1.5 days**

## Phase 2: Group & Admin Logic (4–5 days)
- [ ] Join request approval flow (admin side) — **1 day**
- [ ] Role management (promote/demote admin, restrictions) — **1.5 days**
- [ ] Group leave/delete logic + member-switch-group logic (freeze old data) — **1.5 days**
- [ ] Group settings screen (meal weight editing) — **0.5 day**

## Phase 3: Meal Management (3–4 days)
- [ ] Daily meal toggle UI (breakfast/lunch/dinner) — **1 day**
- [ ] Calendar view per member — **1 day**
- [ ] Meal Sheet tab (table + filter by member) — **1.5 days**

## Phase 4: Bazar / Expense (4–5 days)
- [ ] Bazar entry form (amount, items, optional receipt upload) — **1 day**
- [ ] Firebase Storage integration for receipts — **0.5 day**
- [ ] Admin approval UI (approve/reject queue) — **1 day**
- [ ] Bazar Sheet tab (table, filter, verified/unverified tags, manual entry) — **1.5 days**

## Phase 5: Payment & Extra Cost (3–4 days)
- [ ] Payment entry + approval flow — **1.5 days**
- [ ] Payment Sheet tab — **1 day**
- [ ] Extra Cost entry + approval flow + sheet — **1.5 days**

## Phase 6: Calculation Engine (3–4 days)
- [ ] Cloud Functions: meal rate, extra-cost-per-member, member bill calculation — **2 days**
- [ ] Live recalculation triggers on approval/edit/delete — **1 day**
- [ ] Month finalization/lock function — **1 day**

## Phase 7: Dashboard (2 days)
- [ ] Dashboard UI: meal rate, totals, member list with due/advance — **2 days**

## Phase 8: Polish & Testing (3–4 days)
- [ ] Notifications (meal deadline, approval alerts, due reminders) — **1.5 days**
- [ ] Edge case testing (member switching groups mid-month, sole-admin demotion block, etc.) — **1.5 days**
- [ ] UI polish, empty states, error handling — **1 day**

---

### Total Estimate: ~26–31 focused working days
(Roughly **6–8 weeks** part-time alongside your job, or **4–5 weeks** if you can dedicate more consistent daily time.)

**Suggested build order priority:** Phase 1 → 2 → 3 → 4 → 6 (basic calc early, even before Payment/Extra Cost UI, so you can test the math) → 5 → 7 → 8.
