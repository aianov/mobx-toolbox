import { SchemaOptions, Validator } from './types'

export class ValidatorBuilder {
	private validator: Validator[] = [];

	/**
	 * Уточняет, что данное поле обязательно к заполнению.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .required({ message: "This field is required." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	required(options?: SchemaOptions): this {
		this.validator.push((value) => value ? true : options?.message || "This field is required.")
		return this
	}

	/**
	 * Проверяет, что значение является строкой.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .string({ message: "Value must be string" })
	 * 
	 * @param options - { message: "Err message" }
	 */
	string(options?: SchemaOptions): this {
		this.validator.push((value) => typeof value === 'string' ? true : options?.message || "Must be a string.")
		return this
	}

	/**
	 * Проверяет минимальную длину строки.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .minLength(5, { message: "Minimum length is 5 characters." })
	 * 
	 * @param min - Минимальная длина
	 * @param options - { message: "Err message" }
	 */
	minLength(min: number, options?: SchemaOptions): this {
		this.validator.push((value) =>
			value.length >= min ? true : options?.message || `Must be at least ${min} characters long.`)
		return this
	}

	/**
	 * Проверяет максимальную длину строки.
	 * 
	 * @example
	 * .maxLength(5, { message: "Maximum length is 5 characters." })
	 * 
	 * @param max - Минимальная длина
	 * @param options - { message: "Err message" }
	 */
	maxLength(max: number, options?: SchemaOptions): this {
		this.validator.push((value) =>
			value.length <= max ? true : options?.message || `Must not exceed ${max} characters.`)
		return this
	}

	/**
	 * Проверяет, что значение совпадает с указанным полем.
	 *
	 * @example
	 * .matchField('password', { message: "Passwords do not match." })
	 *
	 * @param field - Название поля для сравнения
	 * @param options - { message: "Err message" }
	 */
	matchField(field: string, options?: SchemaOptions): this {
		this.validator.push((value: any, allValues?: Record<string, any>) => {
			if (!allValues) {
				throw new Error("All values are required for matchField validation.")
			}
			return value === allValues[field]
				? true
				: options?.message || `Value must match ${field}.`
		})
		return this
	}


	/**
	 * Проверяет, соответствует ли значение заданному регулярному выражению.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .regex(/^[a-z]+$/, { message: "Must match the pattern." })
	 * 
	 * @param pattern - Регулярное выражение
	 * @param options - { message: "Err message" }
	 */
	regex(pattern: RegExp, options?: SchemaOptions): this {
		this.validator.push((value) =>
			pattern.test(value) ? true : options?.message || "Does not match the required pattern."
		)
		return this
	}

	/**
	 * Проверяет, является ли значение допустимым адресом электронной почты.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .email({ message: "Must be a valid email address." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	email(options?: SchemaOptions): this {
		this.validator.push((value) =>
			typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
				? true
				: options?.message || "Must be a valid email address."
		)
		return this
	}

	/**
	 * Проверяет, является ли значение допустимым URL.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .url({ message: "Must be a valid URL." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	url(options?: SchemaOptions): this {
		this.validator.push((value) =>
			typeof value === 'string' && /^(ftp|http|https):\/\/[^ "]+$/.test(value)
				? true
				: options?.message || "Must be a valid URL."
		)
		return this
	}

	// ========================== NUM VALIDATIONS ==============================

	/**
	 * Проверяет, что значение не меньше заданного.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .minValue(10, { message: "Value must be at least 10." })
	 * 
	 * @param min - Минимальное значение
	 * @param options - { message: "Err message" }
	 */
	minValue(min: number, options?: SchemaOptions): this {
		this.validator.push((value) =>
			typeof value === 'number' && value >= min
				? true
				: options?.message || `Must be at least ${min}.`
		)
		return this
	}

	/**
	 * Проверяет, что значение не больше заданного.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .maxValue(100, { message: "Value must be no more than 100." })
	 * 
	 * @param max - Максимальное значение
	 * @param options - { message: "Err message" }
	 */
	maxValue(max: number, options?: SchemaOptions): this {
		this.validator.push((value) =>
			typeof value === 'number' && value <= max
				? true
				: options?.message || `Must be no more than ${max}.`
		)
		return this
	}

	/**
	 * Проверяет, что значение равно заданному значению.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .equal("value", { message: "Values must be equal." })
	 * 
	 * @param compareValue - Значение для сравнения
	 * @param options - { message: "Err message" }
	 */
	equal(compareValue: any, options?: SchemaOptions): this {
		this.validator.push((value) =>
			value === compareValue ? true : options?.message || "Values must be equal."
		)
		return this
	}

	/**
	 * Проверяет, что значение является большим целым числом (bigint).
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .bigint({ message: "Must be a big integer." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	bigint(options?: SchemaOptions): this {
		this.validator.push((value) =>
			typeof value === 'bigint' ? true : options?.message || "Must be a big integer."
		)
		return this
	}

	/**
	 * Проверяет, что значение является целым числом (integer).
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .int({ message: "Must be an integer." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	int(options?: SchemaOptions): this {
		this.validator.push((value) =>
			Number.isInteger(value) ? true : options?.message || "Must be an integer."
		)
		return this
	}

	/**
	 * Проверяет, что значение является числом с плавающей запятой (float).
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .float({ message: "Must be a valid number." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	float(options?: SchemaOptions): this {
		this.validator.push((value) =>
			typeof value === 'number' && !Number.isNaN(value) ? true : options?.message || "Must be a valid number."
		)
		return this
	}

	// ========================== DATE VALIDATIONS ==============================

	/**
	 * Проверяет, что значение равно заданной дате.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .dateEqual(new Date('2023-01-01'), { message: "Dates must be equal." })
	 * 
	 * @param compareDate - Дата для сравнения
	 * @param options - { message: "Err message" }
	 */
	dateEqual(compareDate: Date, options?: SchemaOptions): this {
		this.validator.push((value) => {
			const date = new Date(value)
			return date.getTime() === compareDate.getTime()
				? true
				: options?.message || "Dates must be equal."
		})
		return this
	}

	/**
	 * Проверяет, что значение является допустимой датой.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .isDate({ message: "Must be a valid date." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	isDate(options?: SchemaOptions): this {
		this.validator.push((value) => {
			const date = new Date(value)
			return !isNaN(date.getTime()) ? true : options?.message || "Must be a valid date."
		})
		return this
	}

	/**
	 * Проверяет, что дата находится в прошлом.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .isPast({ message: "Date must be in the past." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	isPast(options?: SchemaOptions): this {
		this.validator.push((value) => {
			const date = new Date(value)
			return date < new Date() ? true : options?.message || "Date must be in the past."
		})
		return this
	}

	/**
	 * Проверяет, что дата находится в будущем.
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 * @example
	 * .isFuture({ message: "Date must be in the future." })
	 * 
	 * @param options - { message: "Err message" }
	 */
	isFuture(options?: SchemaOptions): this {
		this.validator.push((value) => {
			const date = new Date(value)
			return date > new Date() ? true : options?.message || "Date must be in the future."
		})
		return this
	}

	// ========= BUILDER REQUIRED ============

	/**
	 * Обязателен в конце каждого ключа схемы!
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 */
	build(): Validator[] {
		return this.validator
	}

	/**
	 * Всегда должно быть в начале валидаций ключа в схеме!
	 * 
	 * Телеграм: https://t.me/nics51
	 * 
	 */
	reset(): this {
		this.validator = []
		return this
	}
}