import path from 'path';
import { execa } from 'execa';
import { FileMissingError } from '@app/core/errors/file-missing-error';
import { type LooseObject, type LooseStringObject } from '@app/core/types';
import { PhpError } from '@app/core/errors/php-error';

/**
 * Encode GET/POST params.
 *
 * @param params Keys/values to be encoded.
 * @ignore
 * @private
 */
const encodeParameters = (parameters: LooseObject) =>
	// Join query params together
	Object.entries(parameters).map(kv =>
		// Encode each section and join
		kv.map(encodeURIComponent).join('='),
	).join('&');
interface Options {
	/** File path */
	file: string;
	/** HTTP Method GET/POST */
	method?: string;
	/** Request query */
	query?: LooseStringObject;
	/** Request body */
	body?: LooseObject;
}

/**
 * Load a PHP file.
 */
export const phpLoader = async (options: Options) => {
	const { file, method = 'GET', query = {}, body = {} } = options;
	const options_ = [
		'./wrapper.php',
		method,
		`${file}${Object.keys(query).length >= 1 ? ('?' + encodeParameters(query)) : ''}`,
		encodeParameters(body),
	];

	return execa('php', options_, { cwd: __dirname })
		.then(({ stdout }) => {
			// Missing php file
			if (stdout.includes(`Warning: include(${file}): failed to open stream: No such file or directory in ${path.join(__dirname, '/wrapper.php')}`)) {
				throw new FileMissingError(file);
			}

			return stdout;
		})
		.catch(error => {
			throw new PhpError(error);
		});
};
