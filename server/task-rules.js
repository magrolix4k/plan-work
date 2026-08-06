/**
 * Workflow rules shared by the Vercel handler (api/index.js) and the dev server
 * (server/index.js). Keeps the board's status flow enforceable server-side
 * instead of relying on every client to behave.
 */

export const VALID_STATUSES = ['backlog', 'plan', 'in_progress', 'in_review', 'done'];

/** Statuses an automated client is allowed to set on its own. */
export const AGENT_ALLOWED_STATUSES = ['backlog', 'plan', 'in_progress', 'in_review'];

export const AGENT_CLIENT_HEADER = 'x-agent-client';

/** The CLI identifies itself so `done` can stay a human-only transition. */
export function isAgentRequest(req) {
  return Boolean(req.headers[AGENT_CLIENT_HEADER]);
}

/**
 * Returns an { status, body } error to send back, or null when the request is fine.
 */
export function checkStatusRules(req, status) {
  if (status === undefined || status === null) return null;

  if (!VALID_STATUSES.includes(status)) {
    return {
      status: 400,
      body: {
        success: false,
        error: `Invalid status "${status}". Valid statuses: ${VALID_STATUSES.join(', ')}`
      }
    };
  }

  if (isAgentRequest(req) && !AGENT_ALLOWED_STATUSES.includes(status)) {
    return {
      status: 403,
      body: {
        success: false,
        error:
          `Agents cannot set status "${status}". ` +
          `Move the task to "in_review" and let the reviewer mark it done on the board.`
      }
    };
  }

  return null;
}
