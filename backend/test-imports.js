(async () => {
  try {
    console.log('Loading jobDiscoveryService...');
    await import('./src/services/jobDiscoveryService.js');
    console.log('jobDiscoveryService OK');
  } catch (err) {
    console.error('jobDiscoveryService FAIL:', err);
  }

  try {
    console.log('Loading formFillerService...');
    await import('./src/services/formFillerService.js');
    console.log('formFillerService OK');
  } catch (err) {
    console.error('formFillerService FAIL:', err);
  }

  try {
    console.log('Loading jobQueueService...');
    await import('./src/services/jobQueueService.js');
    console.log('jobQueueService OK');
  } catch (err) {
    console.error('jobQueueService FAIL:', err);
  }

  try {
    console.log('Loading dominationWorkflowService...');
    await import('./src/services/dominationWorkflowService.js');
    console.log('dominationWorkflowService OK');
  } catch (err) {
    console.error('dominationWorkflowService FAIL:', err);
  }

  process.exit(0);
})();
