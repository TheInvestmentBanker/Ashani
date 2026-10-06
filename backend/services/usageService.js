const { db } = require("../config/database");

const GUEST_DAILY_LIMIT = 500_000;
const USER_DAILY_LIMIT = 50_000_000;

/*
|--------------------------------------------------------------------------
| Get today's usage
|--------------------------------------------------------------------------
|
| We SUM usage rather than relying on a single row.
| This makes the system resilient if multiple usage records
| exist for the same user/day.
|
|--------------------------------------------------------------------------
*/

function getTodayUsage(userId = null, guestId = null) {
  return new Promise((resolve, reject) => {
    let query;
    let parameter;

    /*
    |--------------------------------------------------------------------------
    | Registered user
    |--------------------------------------------------------------------------
    */

    if (userId) {
      query = `
        SELECT
          COALESCE(SUM(tokens_used), 0) AS tokens_used
        FROM usage
        WHERE user_id = ?
          AND date(period_start, 'localtime')
              = date('now', 'localtime')
      `;

      parameter = userId;
    }

    /*
    |--------------------------------------------------------------------------
    | Guest
    |--------------------------------------------------------------------------
    */

    else if (guestId) {
      query = `
        SELECT
          COALESCE(SUM(tokens_used), 0) AS tokens_used
        FROM usage
        WHERE guest_id = ?
          AND date(period_start, 'localtime')
              = date('now', 'localtime')
      `;

      parameter = guestId;
    }

    /*
    |--------------------------------------------------------------------------
    | No identity
    |--------------------------------------------------------------------------
    */

    else {
      return resolve(0);
    }

    db.get(
      query,
      [parameter],
      (error, row) => {
        if (error) {
          return reject(error);
        }

        const tokensUsed =
          Number(row?.tokens_used) || 0;

        resolve(tokensUsed);
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Get current usage
|--------------------------------------------------------------------------
*/

async function getUsage(
  userId = null,
  guestId = null
) {
  const used = await getTodayUsage(
    userId,
    guestId
  );

  const limit = userId
    ? USER_DAILY_LIMIT
    : GUEST_DAILY_LIMIT;

  const remaining = Math.max(
    limit - used,
    0
  );

  const usage = {
    used,
    limit,
    remaining,
  };

  console.log(
    "USAGE CHECK:",
    {
      userId,
      guestId,
      ...usage,
    }
  );

  return usage;
}

/*
|--------------------------------------------------------------------------
| Check whether request is allowed
|--------------------------------------------------------------------------
*/

async function canUseTokens(
  estimatedTokens,
  userId = null,
  guestId = null
) {
  const usage = await getUsage(
    userId,
    guestId
  );

  return {
    allowed:
      usage.remaining >=
      estimatedTokens,

    ...usage,
  };
}

/*
|--------------------------------------------------------------------------
| Record token usage
|--------------------------------------------------------------------------
*/

function recordUsage(
  tokens,
  userId = null,
  guestId = null
) {
  return new Promise(
    (resolve, reject) => {
      const tokenCount =
        Number(tokens) || 0;

      /*
      |--------------------------------------------------------------------------
      | Invalid usage
      |--------------------------------------------------------------------------
      */

      if (tokenCount <= 0) {
        return resolve();
      }

      /*
      |--------------------------------------------------------------------------
      | No identity
      |--------------------------------------------------------------------------
      */

      if (!userId && !guestId) {
        console.warn(
          "Usage could not be recorded: no user or guest ID."
        );

        return resolve();
      }

      /*
      |--------------------------------------------------------------------------
      | Registered user
      |--------------------------------------------------------------------------
      */

      if (userId) {
        db.get(
          `
          SELECT id
          FROM usage
          WHERE user_id = ?
            AND date(period_start, 'localtime')
                = date('now', 'localtime')
          ORDER BY id DESC
          LIMIT 1
          `,
          [userId],
          (error, existing) => {
            if (error) {
              return reject(error);
            }

            /*
            |--------------------------------------------------------------------------
            | Existing daily record
            |--------------------------------------------------------------------------
            */

            if (existing) {
              db.run(
                `
                UPDATE usage
                SET tokens_used =
                    tokens_used + ?
                WHERE id = ?
                `,
                [
                  tokenCount,
                  existing.id,
                ],
                function (updateError) {
                  if (updateError) {
                    return reject(
                      updateError
                    );
                  }

                  console.log(
                    `Usage updated: +${tokenCount} tokens for user ${userId}`
                  );

                  resolve();
                }
              );

              return;
            }

            /*
            |--------------------------------------------------------------------------
            | First usage of the day
            |--------------------------------------------------------------------------
            */

            console.log(
              "INSERTING USER USAGE:",
              {
                userId,
                tokens: tokenCount,
              }
            );

            db.run(
              `
              INSERT INTO usage
              (
                user_id,
                guest_id,
                tokens_used
              )
              VALUES (?, NULL, ?)
              `,
              [
                userId,
                tokenCount,
              ],
              function (insertError) {
                if (insertError) {
                  return reject(
                    insertError
                  );
                }

                console.log(
                  `Usage created: +${tokenCount} tokens for user ${userId}`
                );

                resolve();
              }
            );
          }
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Guest
      |--------------------------------------------------------------------------
      */

      db.get(
        `
        SELECT id
        FROM usage
        WHERE guest_id = ?
          AND date(period_start, 'localtime')
              = date('now', 'localtime')
        ORDER BY id DESC
        LIMIT 1
        `,
        [guestId],
        (error, existing) => {
          if (error) {
            return reject(error);
          }

          /*
          |--------------------------------------------------------------------------
          | Existing daily record
          |--------------------------------------------------------------------------
          */

          if (existing) {
            db.run(
              `
              UPDATE usage
              SET tokens_used =
                  tokens_used + ?
              WHERE id = ?
              `,
              [
                tokenCount,
                existing.id,
              ],
              function (updateError) {
                if (updateError) {
                  return reject(
                    updateError
                  );
                }

                console.log(
                  `Guest usage updated: +${tokenCount} tokens`
                );

                resolve();
              }
            );

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | First usage of the day
          |--------------------------------------------------------------------------
          */

          db.run(
            `
            INSERT INTO usage
            (
              user_id,
              guest_id,
              tokens_used
            )
            VALUES (NULL, ?, ?)
            `,
            [
              guestId,
              tokenCount,
            ],
            function (insertError) {
              if (insertError) {
                return reject(
                  insertError
                );
              }

              console.log(
                `Guest usage created: +${tokenCount} tokens`
              );

              resolve();
            }
          );
        }
      );
    }
  );
}

module.exports = {
  GUEST_DAILY_LIMIT,
  USER_DAILY_LIMIT,
  getUsage,
  canUseTokens,
  recordUsage,
};