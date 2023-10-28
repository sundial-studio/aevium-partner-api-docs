import 'dotenv/config';
import { randomBytes, createHmac } from "crypto";

// The claim is valid for 15 minutes. It needs to last long enough for it
// to be passed through the authentication flow.
const CLAIM_DURATION_SECONDS = 60 * 15;

export function generateInvitationClaim(
  partner: string,
  invitationFields: Record<string, string>,
  invitationSecret: string,
  learnerKey: string,
  salt: string,
  dateExpiresString: string
) {
  if (new Date(dateExpiresString) < new Date()) {
    throw new Error("Expiration date must be in the future");
  }

  // The claim is designed to be appended to a URL. It contains the following parameters:
  const sortedFields = Object.keys(invitationFields).sort();
  const claim = [
    `partner=${partner}`,
    `learner_key=${learnerKey}`,
    `salt=${salt}`,
    `date_expires=${dateExpiresString}`,
    ...sortedFields.map((key) => `field_${key}=${invitationFields[key]}`),
  ].join("&");

  const hmac = createHmac("sha256", invitationSecret);
  hmac.update(claim);
  const signature = hmac.digest("hex");

  return claim + `&signature=${signature}`;
}

/**
 * Use this method of invitation to support direct integration between Aevium and an external application.
 *
 * Aevium generates a `secret` value for every invitation. This is returned by the API when an invitation is created or can be provided by your Aevium representative over a secure channel.
 *
 * Customers use the secret to generate a URL that directs members to the Aevium subscription flow. A `LearnerKey` must be provided with the claim if it is not included in the invitation. The URL format is:
 *   https://aeviumeducation.com/invitation-claim/?partner={partner}&learner_key={learner_key}&salt={salt}&date_expires={date_expires}&field_{field_n}={value_n}&signature={signature}
 */
export function generateSubscribeLink(
  /**
   * The URL at which the target Aevium environment is hosted.
   * For production use, this should be https://aeviumeducation.com. Do not
   * include a trailing slash.
   */
  aeviumBaseUrl: string,
  /**
   * A unique, human-readable identifier for the partner company. Learner keys
   * and invitations are scoped to a partner.
   */
  partner: string,
  /**
   * Taken together, fields are a natural key that uniquely identify an invitation.
   * They are not sensitive and may become visible to learners. Set these values
   * upon invitation creation if doing so programmatically, or request them
   * from your Aevium representative.
   */
  invitationFields: Record<string, string>,
  /**
   * The secret is used to generate a signature that authenticates the claim.
   * This value must not be exposed outside of the partner's internal systems.
   * Retrieve this value upon invitation creation if doing some programmatically,
   * or request it from your Aevium representative.
   */
  invitationSecret: string,
  /**
   * A unique identifier for the learner. The learner key is used to exchange
   * information about the learner with Aevium. It may be visible to learners
   * and to Aevium staff, but it does not need to be human readable.
   * To protect learner privacy and to strengthen security posture, it
   * should not contain identifying information.
   *
   * A good learner key is unique and stable within the partner's system.
   * A random value that is persisted in the member's profile or the member's ID
   * in the partner's system are both good options. Additional opacity can be
   * added by hashing the value.
   */
  learnerKey: string,
  /**
   * An arbitrary, one-time-use value that is specific to the claim. Its only
   * purpose is to add entropy to the signature.
   */
  salt: string = randomBytes(8).toString("hex"),
  /**
   * The date and time at which the claim expires in ISO format. This may be
   * any date in the future. Aevium recommends a claim duration of 15 minutes.
   */
  dateExpires: Date = new Date(
    new Date().getTime() + CLAIM_DURATION_SECONDS * 1000
  )
) {
  const claim = generateInvitationClaim(
    partner,
    invitationFields,
    invitationSecret,
    learnerKey,
    salt,
    dateExpires.toISOString().slice(0, 19)
  );

  return `${aeviumBaseUrl}/invitation-claim/?${claim}`;
}

if (require.main === module) {
  const aeviumBaseUrl = process.env.AEVIUM_BASE_URL || "";
  const partner = process.env.AEVIUM_PARTNER || "example-partner";
  const invitationFields = process.env.AEVIUM_INVITATION_FIELDS
    ? JSON.parse(process.env.AEVIUM_INVITATION_FIELDS)
    : { code: "ABC123" };
  const invitationSecret = process.env.AEVIUM_INVITATION_SECRET || "secret";
  const learnerKey = randomBytes(16).toString("hex");

  console.error("Generating subscribe link with the following parameters: ", {
    aeviumBaseUrl,
    partner,
    invitationFields,
    invitationSecret,
    learnerKey,
  });

  const link = generateSubscribeLink(
    aeviumBaseUrl,
    partner,
    invitationFields,
    invitationSecret,
    learnerKey
  );

  console.log(link);
}
