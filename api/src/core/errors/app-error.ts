/**
 * Generic application error.
 */
export class AppError extends Error {
	/** The HTTP status associated with this error. */
	public status: number;

	/** Should we kill the application when thrown. */
	public fatal = false;

	constructor(message: string, status?: number) {
		// Calling parent constructor of base Error class.
		super(message);

		// Saving class name in the property of our custom error as a shortcut.
		this.name = this.constructor.name;

		// Capturing stack trace, excluding constructor call from it.
		Error.captureStackTrace(this, this.constructor);

		// We're using HTTP status codes with `500` as the default
		this.status = status ?? 500;
	}

	/**
	 * Convert error to JSON format.
	 */
	toJSON() {
		return {
			error: {
				name: this.name,
				message: this.message,
				stacktrace: this.stack,
			},
		};
	}
}
