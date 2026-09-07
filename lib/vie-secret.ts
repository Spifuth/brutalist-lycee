/**
 * The hunt code hidden behind `/vie?debug=true`.
 *
 * It lives here rather than inline in the page so `tests/vie-secret.test.ts`
 * can check it against `db/seeds/secrets.ts`: the page only renders a string,
 * `/chasse` only validates against the seeds, and nothing links the two at
 * runtime. Rename the code on one side and a student types something that is
 * simply refused.
 */
export const VIE_SECRET_CODE = "SIN-DEBUG-PARAM"
