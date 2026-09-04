/**
 * GRADSKOOL — Native mocks exam list
 *
 * Exam slugs that have real, authored native mock-test content
 * (topic-wise / sectional / full mocks under apps.mocks, served at
 * /mocks/[examSlug]) — as opposed to an exam whose PricingPlan merely has
 * `includes_mocks=True` as a general entitlement flag with nothing actually
 * built at /mocks/<slug> yet.
 *
 * This is the single source of truth, used by:
 *   - components/layout/Navbar.jsx    (which exam the "Mocks" navbar link
 *                                       points a logged-in user to)
 *   - pages/courses/[slug]/mocks.jsx  (banner linking the old third-party
 *                                       Testfunda mocks page to the new hub)
 *
 * Add an exam's slug here ONLY once its /mocks/<slug> hub actually has
 * content authored (see apps/mocks/models.py MockTopic/MockPaper) — not
 * just because a plan for that exam has includes_mocks=True.
 */
export const NATIVE_MOCKS_EXAMS = ['snap']
