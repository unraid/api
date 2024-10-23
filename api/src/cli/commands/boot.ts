export const boot = async () => {
    console.log('Booting...', process.env);
    await import('@app/index.ts');
}