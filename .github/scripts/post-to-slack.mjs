import { readFileSync, existsSync } from 'fs';

const TOKEN     = process.env.SLACK_BOT_TOKEN;
const CHANNEL   = process.env.SLACK_CHANNEL;
const THREAD_TS = process.env.SLACK_THREAD_TS;
const BRANCH    = process.env.BRANCH_NAME;
const ISSUE_URL = process.env.ISSUE_URL;
const REPO      = process.env.REPO;

if (!TOKEN || !CHANNEL || !THREAD_TS) {
  console.error('Missing SLACK_BOT_TOKEN, SLACK_CHANNEL, or SLACK_THREAD_TS');
  process.exit(1);
}

const BRANCH_URL = `https://github.com/${REPO}/tree/${BRANCH}`;

const post = (endpoint, body) =>
  fetch(`https://slack.com/api/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());

// 1. Post text message to the thread
const msg = await post('chat.postMessage', {
  channel:   CHANNEL,
  thread_ts: THREAD_TS,
  text: `✅ *Claude implemented a fix.*\n\n*Branch:* \`${BRANCH}\`\n<${BRANCH_URL}|View branch> · <${ISSUE_URL}|View issue>\n\nScreenshots below 👇`,
});
console.log('Message posted:', msg.ok, msg.error || '');

// 2. Upload screenshots to the thread
const screenshots = [
  { path: '/tmp/forge-1-dashboard.png', label: 'Dashboard' },
  { path: '/tmp/forge-2-log.png',       label: 'Workout Log' },
];

for (const { path, label } of screenshots) {
  if (!existsSync(path)) {
    console.log(`No screenshot at ${path}, skipping`);
    continue;
  }

  const file   = readFileSync(path);
  const fname  = `forge-${label.toLowerCase().replace(/\s+/g, '-')}.png`;

  // Get upload URL
  const { upload_url, file_id, error: urlErr } = await post('files.getUploadURLExternal', {
    filename: fname,
    length:   file.length,
  });
  if (urlErr) { console.error('getUploadURLExternal error:', urlErr); continue; }

  // Upload the bytes
  await fetch(upload_url, { method: 'POST', body: file });

  // Complete upload and share to thread
  const complete = await post('files.completeUploadExternal', {
    files:           [{ id: file_id }],
    channel_id:      CHANNEL,
    thread_ts:       THREAD_TS,
    initial_comment: `📱 *${label}*`,
  });
  console.log(`Screenshot ${label}:`, complete.ok, complete.error || '');
}
