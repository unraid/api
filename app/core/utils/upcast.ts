// @note: This was copied directly from the upcast package that OmgImAlexis maintains.
//        The only difference is this version has Typescript support.

/**
 * Guard a 'type' argument
 *
 * @param {String} type argument's type
 */
const guardTypeArg = (type: string) => {
	if (typeof type !== 'string') {
		throw new TypeError('Invalid argument: type is expected to be a string');
	}
};

/**
 * Guard a 'type' handler
 *
 * @param type handler's type
 */
const guardTypeHandler = (type: () => Record<string, unknown>) => {
	if (typeof type !== 'function') {
		throw new TypeError('Invalid argument: handler is expected to be a function');
	}
};

/**
 * Upcast
 *
 * @class Upcast
 */
class Upcast {
	alias: Record<string, string>;

	cast: any;

	/**
     * Creates an instance of Upcast.
     * @memberof Upcast
     */
	constructor() {
		// Define aliases
		this.alias = {
			a: 'array',
			arr: 'array',
			array: 'array',
			b: 'boolean',
			bool: 'boolean',
			boolean: 'boolean',
			null: 'null',
			n: 'number',
			num: 'number',
			number: 'number',
			o: 'object',
			obj: 'object',
			object: 'object',
			s: 'string',
			str: 'string',
			string: 'string',
			undefined: 'undefined'
		};

		// Default casters
		this.cast = {
			array: <T>(value: T) => [value],
			boolean: (value: unknown) => Boolean(value),
			function: (value: unknown) => () => value,
			null: () => null,
			number: (value: unknown) => Number(value),
			// eslint-disable-next-line no-new-object
			object: (value: unknown) => new Object(value),
			string: (value: unknown) => String(value),
			undefined: () => undefined
		};

		// Special casters
		this.cast.array.null = () => [];
		this.cast.array.undefined = () => [];
		this.cast.array.string = (value: string) => {
			if (value === 'false' || value === 'true') {
				return [this.cast.boolean.string(value)];
			}

			return value.split('');
		};

		this.cast.boolean.array = (value: unknown[]) => value.length > 0;
		this.cast.boolean.string = (value: string) => {
			if (value === 'false') {
				return false;
			}

			return this.cast.boolean(value);
		};

		this.cast.number.array = (value: unknown[]) => this.to(this.to(value, 'string'), 'number');
		this.cast.number.string = (value: string) => {
			if (value === 'false' || value === 'true') {
				value = this.cast.boolean.string(value);
			}

			const number = Number.parseInt(value, 10);
			return (isNaN(number) ? 0 : number);
		};

		this.cast.number.undefined = () => 0;
		this.cast.string.array = (value: unknown[]) => value.join('');
		this.cast.string.null = () => '';
		this.cast.string.undefined = () => '';
		this.cast.object.string = (value: string) => {
			if (value === 'false' || value === 'true') {
				value = this.cast.boolean.string(value);
			}

			return this.cast.object(value);
		};
	}

	/**
     * Add custom cast
     */
	add(type: string, handler: () => Record<string, unknown>) {
		guardTypeArg(type);
		guardTypeHandler(handler);

		this.cast[type] = handler.bind(this);
	}

	/**
     * Resolve type aliases
     */
	resolve(alias: string) {
		return this.alias[alias] || alias;
	}

	/**
     * Get a object's type
     */
	type(type: unknown) {
		if (type === null) {
			return 'null';
		}

		if (Object.prototype.toString.call(type) === '[object Array]') {
			return 'array';
		}

		return typeof type;
	}

	/**
     * Check whether an object is of a certain type.
     */
	is(object: unknown, type: string) {
		guardTypeArg(type);
		return (this.type(object) === this.resolve(type));
	}

	/**
     * Cast an object to a given type.
     */
	to(object: unknown, type: string) {
		guardTypeArg(type);

		// Get type and return if already correct
		type = this.resolve(type);
		const from = this.type(object);
		if (type === from) {
			return object;
		}

		// Get a caster and cast!
		if (!this.cast[type]) {
			return object;
		}

		const caster = this.cast[type][from] || this.cast[type];
		return caster(object);
	}
}

export const upcast = new Upcast();
