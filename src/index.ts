import { makeAutoObservable } from 'mobx'
import { AnnotationsMap } from 'mobx/dist/internal'
import { FormErrors, FormStateOptions, FormValues, Identifiable, MakeObservableOptions, MobxState, MobxStateWithGetterAndSetter, NestedKeyOf, UpdaterT, ValidationResult, Validator } from './types'
import { ValidatorBuilder } from './validators'

// ========================== VALIDATION SCHEMA ==============================

class ValidationSchema extends ValidatorBuilder {
	validators: Record<string, Validator[]> = {};

	/**
 * Используется для валидации ваших ключей инпута.
 * 
 * Телеграм: https://t.me/nics51
 *
 * @example
 * // Создаем cхему
 * export const orderFormSchema = m.schema({
 * 	name: m.reset()
 * 		.required()
 * 		.string()
 * 		.minLength(3, { message: 'Name must be at least 3 characters long' })
 * 		.build(),
 * 	description: m.reset()
 * 		.required({ message: 'Please provide a description' })
 * 		.string()
 * 		.minLength(10)
 * 		.build()
 * })
 * 
 * Схема может быть переиспользована и используется для функции useMobxForm
 *
 * @param object - опишите здесь настройки валидации, не забудьте в конце писать .build()
 * 
 */
	schema(validators: Record<string, Validator[]>): ValidationSchema {
		const schema = new ValidationSchema()
		schema.validators = validators
		return schema
	}

	/**
	  * Добавляет новые валидаторы к существующей схеме.
	  * 
	  * Телеграм: https://t.me/nics51 
	  * 
	  * @example
	  * export const newScheme = signScheme.extend({
	  * 	newKey: // your new validations + signScheme validations
	  * })
	  * 
	  * Так-же вторым параметром идет override который по умолчанию false.
	  * Если override true то старый ключ из родителя будет удален и заменен новым ключем если они имеют одинаковое наименование.
	  * Если же override false то валидаторы в новом и старом ключе будут объединены.
	  * 
	  * @param newValidators - новый набор валидаторов для добавления
	  * @param override - если true, то переопределяет существующие валидаторы
	  * @returns {ValidationSchema} - обновленная схема
	  * 
	  */
	extend(newValidators: Record<string, Validator[]>, override: boolean = false): ValidationSchema {
		for (const field in newValidators) {
			if (override || !this.validators[field]) this.validators[field] = newValidators[field]
			else this.validators[field] = this.validators[field].concat(newValidators[field])
		}
		return this
	}

	/**
	  * Выбирает только определенные ключи из схемы
	  * 
	  * Телеграм: https://t.me/nics51 
	  * 
	  * @param keys - массив ключей, которые нужно выбрать из схемы
	  * @returns {ValidationSchema} - новая схема с выбранными ключами
	  * 
	  */
	pick(keys: string[]): ValidationSchema {
		const pickedValidators: Record<string, Validator[]> = {}

		for (const key of keys) {
			if (this.validators[key]) {
				pickedValidators[key] = this.validators[key]
			}
		}

		return this.schema(pickedValidators)
	}

	validate(values: Record<string, any>): ValidationResult {
		const errors: Record<string, string> = {}
		let success = true

		for (const field in this.validators) {
			const validators = this.validators[field]
			for (const validate of validators) {
				const validationResult = validate(values[field])
				if (validationResult !== true) {
					success = false
					errors[field + 'Err'] = typeof validationResult === 'string'
						? validationResult
						: `Invalid value for ${field}`
					break
				}
			}
		}

		return { success, errors }
	}
}

class FormState<T> {
	values: FormValues<T>
	errors: FormErrors<T> = {} as FormErrors<T>
	validationSchema: ValidationSchema
	options: Partial<FormStateOptions> = { instaValidate: true, validateAllOnChange: false, inputResetErr: true }
	initialValues: FormValues<T>
	disabled: boolean = false

	constructor(
		initialValues: FormValues<T>,
		validationSchema: ValidationSchema,
		options: FormStateOptions
	) {
		this.initialValues = initialValues
		this.values = initialValues
		this.validationSchema = validationSchema
		this.options = options
		if (options.disabled) this.disabled = options.disabled

		makeAutoObservable(this, options.observableAnnotations || {}, options.observableOptions || {})
	}

	/**
 * Сеттер значений
 * 
 * Телеграм: https://t.me/nics51
 *
 */
	setValue = (field: string, value: T[keyof T]) => {
		this.values[field as keyof T] = value

		// @ts-ignore
		if (this.options.inputResetErr) this.errors[`${field}Err`] = ''
		if (this.options.instaValidate) {
			const error = this.validationSchema.validate(this.values)
			this.disabled = !error.success
			if (this.options.validateAllOnChange) this.errors = error.errors as FormErrors<T>
			else this.errors = { ...this.errors, [field + 'Err']: error.errors[field + 'Err'] }
		}
		if (value == '' && this.options.resetErrIfNoValue) {
			this.errors = { ...this.errors, [field + 'Err']: '' }
			this.disabled = this.disabled = Object.values(this.errors).some(error => error !== '')
		}
	};

	/**
 * Сеттер ошибок
 * 
 * Телеграм: https://t.me/nics51
 *
 */
	setError(field: keyof T, error: string) {
		// @ts-ignore
		this.errors[`${field}Err`] = error || ''
	}

	/**
 * Возвращает все инпуты к начальному состоянию
 * 
 * Телеграм: https://t.me/nics51
 *
 */
	reset() {
		this.values = { ...this.initialValues }
		this.errors = {} as FormErrors<T>
	}

	/**
 * Отвечает за валидацию ключей, ошибки записывает в errors, отдает true или false если валидация с ошибками или без
 * 
 * Телеграм: https://t.me/nics51
 *
 * @example
 * this.orderForm.validate() // true | false если валидация успешна
 *
 * @param none - Параметров нет
 * 
 */
	validate(): boolean {
		const result: ValidationResult = this.validationSchema.validate(this.values)
		if (!result.success) this.errors = result.errors as FormErrors<T>
		else this.errors = {} as FormErrors<T>

		this.disabled = !result.success

		return result.success
	}
}

// ========================== USE MOBX UPDATER ==============================

class MobxUpdater {
	constructor(annotations: AnnotationsMap<MobxState, never> = {}) {
		makeAutoObservable(this, annotations, { autoBind: true })
	}

	/** 
	 * Метод для получения функции обновления для массива или объекта
	 * 
	 * @param arrayOrObject - Массив или объект, который нужно обновить.
	 * @returns Функция для обновления состояния.
	 */
	getUpdater<T extends Identifiable>(arrayOrObject: T[] | Record<string, T>) {
		return <K extends NestedKeyOf<T>>(
			id: string | number,
			key: K,
			updater: UpdaterT<T, K>
		) => {
			this.updateState(arrayOrObject, id, key, updater)
		}
	}

	/** 
	 * Метод для обновления состояния элемента в массиве или объекте.
	 * 
	 * @param arrayOrObject - Массив или объект, который нужно обновить.
	 * @param id - Идентификатор элемента для обновления.
	 * @param key - Ключ или путь для обновления.
	 * @param updater - Функция обновления или новое значение для обновления.
	 */
	updateState<T extends Identifiable, K extends NestedKeyOf<T>>(
		arrayOrObject: T[] | Record<string, T>,
		id: string | number,
		key: K,
		updater: UpdaterT<T, K>
	) {
		const item = Array.isArray(arrayOrObject)
			? arrayOrObject.find((item) => item.id === id)
			: arrayOrObject[id]

		if (item) this.deepUpdate(item, key, updater)
	}

	/** 
	 * Вспомогательный метод для выполнения глубокого обновления по пути.
	 * 
	 * @param obj - Объект, в котором нужно выполнить обновление.
	 * @param key - Путь или ключ, по которому будет выполнено обновление.
	 * @param updater - Функция или новое значение для обновления.
	 */
	private deepUpdate<T, K extends NestedKeyOf<T>>(
		obj: T,
		key: K,
		updater: UpdaterT<T, K>
	) {
		const keys = key.split(".") as string[]
		const lastKey = keys.pop() as string

		const target = keys.reduce((acc, k) => {
			if (k.includes("[")) {
				const [arrayKey, index] = k.split(/\[|\]/).filter(Boolean)
				return acc?.[arrayKey]?.[Number(index)]
			}
			return acc?.[k]
		}, obj as any)

		if (target && lastKey) {
			if (typeof updater === "function") {
				const prevValue = target[lastKey as keyof typeof target]
				target[lastKey as keyof typeof target] = (updater as (prevValue: any) => any)(prevValue)
			} else target[lastKey as keyof typeof target] = updater
		}
	}
}

// ========================== EXPORTS ==============================

/**
 * Создает MobX состояние с геттером, сеттером, поддержкой кастомных декораторов и настроек.
 * 
 * Телеграм: https://t.me/nics51
 *
 * Первый вызов функции — передача начального значения состояния и опций MobX.
 * Второй вызов — передача имени состояния (ключа), который будет динамически создан.
 *
 * @example
 * // Создаем состояние с начальным значением 0
 * const counter = mobxState(0)('counter');
 *
 * // Теперь можно использовать `counter.counter` для получения значения
 * и counter.setCounter(newValue | (prevValue) => newValue) для его изменения.
 * или const { counter: { counter, setCounter } } = counterStore.counter
 *
 * @param initialValue - начальное значение
 * @param annotations - объект аннотаций MobX, использовать как { переданное имя: observable... }
 * @param options - дополнительные опции для makeAutoObservable (например, autoBind, deep...)
 * @returns Функция, которая принимает параметр `name` и возвращает объект состояния с геттером и сеттером этого же `name`.
 */
export function mobxState<T>(
	initialValue: T,
	annotations: AnnotationsMap<MobxState, never> = {},
	options: MakeObservableOptions = {}
): <K extends string>(name: K) => MobxStateWithGetterAndSetter<T, K> {
	return function <K extends string>(name: K): MobxStateWithGetterAndSetter<T, K> {
		const state: MobxState = {
			[name]: initialValue,
			[`set${name.charAt(0).toUpperCase() + name.slice(1)}`](newValue: T | ((prev: T) => T)): void {
				if (typeof newValue === 'function') state[name] = (newValue as (prev: T) => T)(state[name])
				else state[name] = newValue
			},
		}
		makeAutoObservable(state, annotations, options)
		return state as MobxStateWithGetterAndSetter<T, K>
	}
}

/**
 * Создает обьект со всеми нужными настройками для управления формой, инпутами и ошибками.
 * 
 * Телеграм: https://t.me/nics51
 *
 * @example
 * // Создаем форму
 * orderForm = useMobxForm({
 * 	name: '',
 * 	description: '',
 * },
 * 	orderFormSchema,
 * 	{ instaValidate: true, inputResetErr: true }
 * );
 * 
 * Теперь можно получить в компоненте:
 * const {
 * 	orderForm: {
 * 		setValue,
 * 		values: { name, description },
 * 		errors: { nameErr, descriptionErr }
 * 	}
 * } = orderStore
 *
 * @param initialValues - обьект с ключами для инпутов
 * @param schema - объект схемы с настройками валидаций
 * @param options - дополнительные опции для формы а так-же для makeAutoObservable
 * 
 * `instaValidate` отвечает за мгновенную валидацию при наборе в инпут, по умолчанию true
 * 
 * `inputResetErr` отвечает за мгновенное очищение ошибок при наборе в инпут, по умолчанию true
 * 
 * `validateAllOnChange` работает только если instaValidate true, она работает так что валидирует абсолютно все инпуты даже если юзер пишет в одном, по умолчанию false
 * 
 * `resetErrIfNoValue` очищает ошибку если инпут пустой, по умолчанию true
 * 
 * `observableAnnotations` - аннотации для makeAutoObservable
 * 
 * `observableOptions` - настройки для makeAutoObservable
 * 
 */
export function useMobxForm<T>(
	initialValues: FormValues<T>,
	validationSchema: ValidationSchema,
	options: Partial<FormStateOptions> = {
		instaValidate: true,
		inputResetErr: true,
		validateAllOnChange: false,
		resetErrIfNoValue: true,
		disabled: false,
		observableAnnotations: {},
		observableOptions: {}
	},
) {
	return new FormState<T>(initialValues, validationSchema, options)
}

/**
 * От этой фунции можно создать схемы и валидации :)
 * 
 * Телеграм: https://t.me/nics51
 * 
 * @example
 * export const signScheme = m.scheme({
 * 	email: m.reset()
 * 		.required()
 * 		.build()
 * })
 *
 */
export const m = new ValidationSchema()

/** 
 * Функция для удобнейшего обновления состояния массива или объекта.
 * (Работает только с массивами из MobX)
 * 
 * Телеграм: https://t.me/nics51
 * 
 * @example
 * const updateComments = useMobxUpdate(commentsList)
 * 
 * onClick={() => {
 * 	commentsUpdate(comment.id, "count", (prev) => prev+1) // prev++ НЕ РАБОТАЕТ
 * }
 * 
 * Приятного использования ;)
 * 
 * @param arrayOrObject - Массив или объект, который нужно обновить.
 * @param annotations - объект аннотаций MobX, использовать как { переданное имя: observable... }
 * @returns Функция для обновления состояния элемента.
 */
export const useMobxUpdate = <T extends Identifiable>(
	arrayOrObject: T[] | Record<string, T>,
	annotations: AnnotationsMap<MobxState, never> = {},
) => {
	return <K extends NestedKeyOf<T>>(
		id: string | number,
		key: K,
		updater: UpdaterT<T, K>
	) => {
		(new MobxUpdater(annotations)).updateState(arrayOrObject, id, key, updater)
	}
}
