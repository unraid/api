export default ({ store, logger }) => ({
  _type: "UnraidApiPlugin",
  name: "HealthPlugin",
  description: "Health plugin",

  commands: [],

  config() {
    return ['health', { demo: true}]
  },

  async registerGraphQLResolvers() {
    return {
      Query: {
        health: () => {
            logger.log("Pinged health");
            return "OK";
        }
      }
    };
  },

  async registerGraphQLTypeDefs() {
    return `
      type Query {
        health: String
      }
    `;
  },
  async onModuleInit() {
    logger.log("Health plugin initialized");
  },

  async onModuleDestroy() {
    logger.log("Health plugin destroyed");
  },
});
