process.title = 'unraid-api';
setInterval(() => {
	console.log('I NEED TO DIE (but i am very hard to kill)');
}, 5_000);

process.on('SIGTERM', () => {
	// Do nothing
	console.log('you cant kill me haha');
});
