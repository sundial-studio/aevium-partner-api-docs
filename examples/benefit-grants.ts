import 'dotenv/config';

const API_ROOT = `${process.env.AEVIUM_BASE_URL || ""}/api/partner/v1`;
const API_KEY = process.env.AEVIUM_API_KEY || "";

type BenefitGrantResponse = {
  uid: string;
  amount: number;
  datePeriodStart: string;
  datePeriodEnd: string;
};

/**
 * Customers provide education benefits to subscribed learners by creating grants. Aevium offers considerable flexibility on the form grants can take and the criteria for receiving them.
 *
 * In general, a grant uniquely identifies a recipient, establishes the grant period, and defines the level of benefits received. Grants may be sent to Aevium transactionally using our customer-facing API or sent in bulk at intervals.
 *
 * Describing benefits in terms of a program and a level protects sensitive learner information. This is preferable to sending the underlying account information used to calculate benefits, such as the member’s subscription tier or account balance. Aevium will interpret the grant level to deliver the appropriate benefits.
 *
 * Aevium assumes that if a grant is not received, then the member is no longer receiving benefits through the customer. In general, Aevium does not deliver benefits automatically.
 */
export async function postBenefitGrant(
  /**
   * A unique identifier for the learner. The learner must be subscribed.
   */
  learnerKey: string,
  /**
   * The start of the date range covered by the grant. Grants should not overlap
   * within a program. Aevium truncates this value to the day.
   */
  datePeriodStart: Date,
  /**
   * The end of the date range covered by the grant. Aevium truncates this value
   * to the day.
   */
  datePeriodEnd: Date,
  /**
   * The name of the program under which benefits are being given. The program
   * determines the levels at which benefits may be granted. Request this value
   * from your Aevium representative.
   */
  program: string,
  /**
   * The name of the program level at which benefits are granted.
   * This value determines the number of grants added to the learner's
   * Aevium account.
   */
  level: string
) {
  const response = await fetch(`${API_ROOT}/benefit-grants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      learnerKey,
      datePeriodStart: datePeriodStart.toISOString(),
      datePeriodEnd: datePeriodEnd.toISOString(),
      program,
      level,
    }),
  });

  if (!response.ok) {
    throw {
      status: response.status,
      error: await response.json()
    };
  }

  return (await response.json()) as BenefitGrantResponse;
}

/**
 * Each benefit grant is assigned a unique identifier. Use this value to
 * confirm receipt of a grant.
 */
export async function getBenefitGrant(uid: string) {
  const response = await fetch(`${API_ROOT}/benefit-grants/${uid}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    throw {
      status: response.status,
      error: await response.json()
    };
  }

  return (await response.json()) as BenefitGrantResponse;
}

if (require.main === module) {
  // Pass the learner key as the first argument.
  const learnerKey = process.argv[2];
  const program = process.argv[3] || process.env.AEVIUM_DEFAULT_BENEFIT_PROGRAM;
  const level = process.argv[4] || process.env.AEVIUM_DEFAULT_BENEFIT_PROGRAM_LEVEL;

  if (!learnerKey || !program || !level) {
    console.error(
      "Usage: node benefit-grants.js <learnerKey> <program> <level>"
    );
    process.exit(1);
  }

  postBenefitGrant(
    learnerKey,
    new Date(),
    new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // in 30 days
    program,
    level
  )
    .then((grant) => {
      console.log(`Created grant ${grant.uid}`);

      console.log("\nFetching grant...");
      getBenefitGrant(grant.uid)
        .then((grant) => {
          console.log("Confirmed existence of grant:", grant);
        })
        .catch((error) => {
          console.error("Failed to fetch grant:", JSON.stringify(error, null, 2));
        });
    })
    .catch((error) => {
      console.error("Failed to create grant:", JSON.stringify(error, null, 2));
    });
}
