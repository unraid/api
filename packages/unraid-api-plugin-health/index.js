class UnraidAPIPlugin {
  constructor(store, logger) {
    this.store = store;
    this.logger = logger;
  }
}

export default ({ store, logger }) => ({
  _type: "UnraidApiPlugin",
  name: "HealthPlugin",
  description: "Health plugin",

  commands: [],

  async onModuleInit() {
    logger.log("Health plugin initialized");
  },

  async onModuleDestroy() {
    logger.log("Health plugin destroyed");
  },
});
