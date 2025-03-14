class ApiError extends Error {
	private statusCode: number;
	private data: any;
	private errors: any[];

	constructor(
		statusCode: number,
		message: string = 'Internal Server Error',
		data: any = null,
		errors: any[] = [],
		stack: string = ''
	) {
		super(message);
		this.statusCode = statusCode;
		this.message = message;
		this.data = data;
		this.errors = errors;

		if (this.stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export default ApiError;
