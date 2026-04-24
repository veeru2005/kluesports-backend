const cron = require('node-cron');
const Event = require('../models/Event');
const {
    FreeFireRegistration,
    BGMIRegistration,
    ValorantRegistration,
    CallOfDutyRegistration
} = require('../models/Registration');
const sendEmail = require('./sendEmail');

const ALL_MODELS = [
    FreeFireRegistration,
    BGMIRegistration,
    ValorantRegistration,
    CallOfDutyRegistration
];

const buildReminderEmail = (teamLeadName, teamName, event, game) => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(event.end_time);

    const dateStr = startDate.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
    });
    const startTimeStr = startDate.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    }).replace(/am|pm/gi, s => s.toUpperCase());
    const endTimeStr = endDate.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    }).replace(/am|pm/gi, s => s.toUpperCase());

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:Verdana,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#121212;border:2px solid #dc2626;border-radius:12px;overflow:hidden;">

        <!-- BADGE -->
        <tr>
          <td align="center" style="padding:30px 15px 10px 15px;background-color:#121212;">
            <div style="display:inline-block;background-color:#dc2626;color:#fefefe;padding:7px 16px;border-radius:20px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">⏰ 30-Minutes Match Reminder</div>
          </td>
        </tr>

        <!-- HEADER -->
        <tr>
          <td align="center" style="padding:20px 30px 30px 30px;border-bottom:2px solid #dc2626;background-color:#121212;">
            <img src="https://res.cloudinary.com/djzocjzl7/image/upload/v1772465624/Logo1_kbdvpg.png" width="80" height="80" alt="KLU ESPORTS" style="display:block;border-radius:50%;border:2px solid #dc2626;margin:0 auto 16px auto;">
            <h1 style="margin:0;font-size:22px;letter-spacing:1px;">
              <span style="color:#d1d1d1;font-weight:900;">KLU</span> <span style="color:#dc2626;font-weight:900;">ESPORTS</span>
            </h1>
            <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">Match Starting in 30 Minutes!</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px 28px;background-color:#121212;">
            <p style="color:#d1d1d1;font-size:15px;margin:0 0 6px;">Hi <strong style="color:#dc2626;">${teamLeadName}</strong>,</p>
            <p style="color:#a1a1aa;font-size:13px;margin:0 0 24px;">This is your reminder — your match begins in <strong style="color:#fca5a5;">30 minutes</strong>. Get your team to the venue now!</p>

            <!-- Match Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;border-radius:8px;margin-bottom:20px;border:1px solid #dc2626;">
              <tr><td style="padding:12px 18px;border-bottom:1px solid #dc2626;">
                <p style="margin:0;color:#dc2626;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Match Details</p>
              </td></tr>
              <tr><td style="padding:16px 18px;">
                <table width="100%" cellpadding="5">
                  <tr>
                    <td style="color:#71717a;font-size:12px;width:36%;">Event</td>
                    <td style="color:#d1d1d1;font-size:13px;font-weight:700;">${event.title}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Game</td>
                    <td style="color:#d1d1d1;font-size:13px;">${game}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Your Team</td>
                    <td style="color:#dc2626;font-size:14px;font-weight:700;">${teamName}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Date</td>
                    <td style="color:#d1d1d1;font-size:13px;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Start Time</td>
                    <td style="color:#fca5a5;font-size:16px;font-weight:900;">${startTimeStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">End Time</td>
                    <td style="color:#d1d1d1;font-size:13px;">${endTimeStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Venue</td>
                    <td style="color:#d1d1d1;font-size:13px;">${event.location}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a0000;border-radius:8px;border:1px solid #dc2626;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;text-align:center;">
                <p style="margin:0;color:#fca5a5;font-size:15px;font-weight:700;">🎮 Report to the venue NOW and warm up your squad!</p>
              </td></tr>
            </table>

            <p style="color:#71717a;font-size:12px;margin:0;text-align:center;">Best of luck from the KLU ESPORTS TEAM! 🎮</p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding:20px 15px;background-color:#0f0f0f;border-top:2px solid #dc2626;">
            <div style="margin-bottom:10px;white-space:nowrap;">
              <a href="https://www.instagram.com/klu__esports/" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/174/174855.png" alt="Instagram" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">Instagram</a>
              <span style="color:#71717a;">|</span>
              <a href="https://discord.com/invite/pp9wnEjbt" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/5968/5968756.png" alt="Discord" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">Discord</a>
              <span style="color:#71717a;">|</span>
              <a href="https://www.youtube.com/@esports.kluniversity" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384060.png" alt="YouTube" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">YouTube</a>
              <span style="color:#71717a;">|</span>
              <a href="https://www.linkedin.com/company/kl-esports-club" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/174/174857.png" alt="LinkedIn" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">LinkedIn</a>
            </div>
            <p style="color:#71717a;font-size:11px;margin:10px 0 0;">© 2026 KLU ESPORTS CLUB. All rights reserved.</p>
            <p style="color:#71717a;font-size:10px;margin:6px 0 0;">Designed and Developed by <a href="https://www.veerendra-portfolio.in/" target="_blank" style="color:#dc2626;text-decoration:none;">S. Veerendra Chowdary</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// Tracks which (eventId + registrationId) combos have already been reminded
// to avoid duplicate sends if the cron fires multiple times in the same window
const remindedSet = new Set();

const startReminderScheduler = () => {
    // Runs every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Window: events starting between 29 min 30 sec and 30 min 30 sec from now
            const windowStart = new Date(now.getTime() + 29 * 60 * 1000 + 30 * 1000);
            const windowEnd   = new Date(now.getTime() + 30 * 60 * 1000 + 30 * 1000);

            const upcomingEvents = await Event.find({
                event_date: { $gte: windowStart, $lte: windowEnd }
            });

            if (!upcomingEvents.length) return;

            for (const event of upcomingEvents) {
                for (const Model of ALL_MODELS) {
                    const registrations = await Model.find({ eventId: event._id });
                    for (const reg of registrations) {
                        const key = `${event._id}-${reg._id}`;
                        if (remindedSet.has(key)) continue;
                        remindedSet.add(key);

                        const teamLead = reg.teamLead;
                        if (!teamLead || !teamLead.email) continue;

                        const emailHtml = buildReminderEmail(
                            teamLead.name,
                            reg.teamName,
                            event,
                            reg.game
                        );

                        sendEmail(
                            teamLead.email,
                            `⏰ Match Reminder – ${event.title} starts in 30 minutes!`,
                            emailHtml
                        ).catch(err => console.error(`Reminder email failed for ${teamLead.email}:`, err.message));
                    }
                }
            }
        } catch (err) {
            console.error('Reminder scheduler error:', err.message);
        }
    });

    console.log('✅ 30-minute match reminder scheduler started');
};

module.exports = startReminderScheduler;
