// Hook this into your existing email / in-app notifications.
// Events: approval_needed, reconnect_needed, token_expiring, post_uncertain, post_failed
async function notify(userId, event, data = {}) {
  console.log('[notify]', userId, event, JSON.stringify(data));
  // In the future: await sendEmail(...) / await Notification.create(...)
}

export { notify };
export default notify;
