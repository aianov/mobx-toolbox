import { AnnotationsMap, makeAutoObservable, onBecomeUnobserved } from 'mobx'
import { FormErrors, FormStateOptions, FormValues, Identifiable, MakeObservableOptions, MobxSaiFetchOptions, MobxSaiInstance, MobxStateOptions, MobxStateWithGetterAndSetter, NestedKeyOf, UpdaterT, ValidationResult, Validator } from './types'
import { ValidatorBuilder } from './validators'

// ========================== MOBX STATE ==============================

class MobxState<K extends string, T> {
	[key: string]: any

	constructor(
		initialValue: T,
		name: K,
		annotations: Record<string, any> = {},
		makeObservableOptions: MakeObservableOptions = {},
		options: MobxStateOptions = {}
	) {
		const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
		const resetValue = initialValue

		this[name] = initialValue as this[K]

		this[`set${capitalizedName}`] = (newValue: T | ((prev: T) => T)) => {
			if (typeof newValue === "function") this[name] = (newValue as (prev: T) => T)(this[name] as T) as this[K]
			else this[name] = newValue as this[K]
		}

		makeAutoObservable(this, annotations, makeObservableOptions)

		if (options.reset) {
			onBecomeUnobserved(this, name, () => {
				this[name] = resetValue as this[K]
			})
		}
	}
}

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
				const validationResult = validate(values[field], values)
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

const formStateDefaultOptions = {
	instaValidate: true,
	inputResetErr: true,
	validateAllOnChange: false,
	resetErrIfNoValue: true,
	disabled: false,
	observableAnnotations: {},
	observableOptions: {}
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
		this.options = { ...formStateDefaultOptions, ...options }
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
	constructor(annotations: AnnotationsMap<{ [key: string]: any }, never> = {}) {
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
 * Если путь или ключ отсутствует, они будут созданы.
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
				if (!acc[arrayKey]) acc[arrayKey] = []
				if (!acc[arrayKey][Number(index)]) acc[arrayKey][Number(index)] = {}
				return acc[arrayKey][Number(index)]
			}
			if (!acc[k]) acc[k] = {}
			return acc[k]
		}, obj as any)

		if (target && lastKey) {
			if (typeof updater === "function") {
				const prevValue = target[lastKey as keyof typeof target]
				target[lastKey as keyof typeof target] = (updater as (prevValue: any) => any)(prevValue)
			} else target[lastKey as keyof typeof target] = updater
		}
	}
}

// ========================== MOBX SAI FETCH ==============================

const defaultOptions: MobxSaiFetchOptions = {
	id: "default",
	page: null,
	pageSetterName: null,
	isFetchUp: false,
	fetchType: "default",
	fetchIfPending: false,
	fetchIfHaveData: true,
}

const fetchCache = new Map<string, MobxSaiInstance<any>>()

class MobxSaiFetch<T> {
	constructor(options?: Partial<MobxSaiFetchOptions>) {
		this.options = { ...defaultOptions, ...options }
		makeAutoObservable(this, {}, { autoBind: true })
	}

	/** 
 * Указатель того является ли запрос в обработке или нет (полезно если не хочешь использовать длинное сравнение с status)
 */
	isPending = false;

	/** 
 * Указатель того является ли запрос обработанным или нет (полезно если не хочешь использовать длинное сравнение с status)
 */
	isFulfilled = false;

	/** 
 * Указатель того является ли запрос отклонённым или нет (полезно если не хочешь использовать длинное сравнение с status)
 */
	isRejected = false;

	/** 
 * Статус текущего запроса, в обработке, обработан или отклонён
 */
	status: "pending" | "fulfilled" | "rejected" = "pending";

	/** 
 * Здесь хранится ответ из вашей функции запроса
 */
	data: T | null = null;

	/** 
 * Тут хранится ошибка от запроса
 */
	error: Error | null = null;

	/** 
 *	Супа, хайпа, галакси настройки для mobxSaiFetch
 *	
 *	`id` - Обязателен если хотите использовать options
 *	
 *	`page` - Это должно быть состояние от mobxState из этой-же библиотеки, нужна чтобы обновлять page (если у вас в fetchType указано "pagination")
 *	
 *	`pageSetterName` - Название во втором параметре mobxState у вашего page, тоесть например page = mobxState(1)("privet") вам нужно здесь передать "privet"
 *	
 *	`isFetchUp` - Флаг отвечающий за то делать ли page + 1 или page - 1
 *	
 *	`fetchType` - По умолчанию ваще имеет "default" но если хотите с пагинацией то "pagination"
 *	
 *	`fetchIfPending` - Отвечает за то, будут ли воспроизводится запросы в тот момент когда запрос уже идёт. Тоесть если вы укажете true то у вас будут запросы без остановки и ожидания. По умолчанию стоит false (Позаботился о джунам авхвааахв)
 *	
 *	`fetchIfHaveData` - Если указать false то запрос не будет идти если у вас уже есть ответ с предыдущего запроса, по умолчанию true
 *	
 */
	options: MobxSaiFetchOptions = { ...defaultOptions };

	fetch = (promiseOrFunction: Promise<T> | (() => Promise<T>)): this => {
		const { fetchIfPending, fetchIfHaveData } = this.options

		if (!fetchIfPending && this.isPending) {
			console.log("Fetch is already pending and fetchIfPending is false.")
			return this
		}

		if (!fetchIfHaveData && this.data) {
			console.warn("Data already exists and fetchIfHaveData is false.")
			return this
		}

		this.setPending()

		this.status = "pending"
		this.data = null
		this.error = null

		const fetchPromise = promiseOrFunction instanceof Promise
			? () => promiseOrFunction
			: promiseOrFunction

		fetchPromise()
			.then((result) => {
				this.status = "fulfilled"
				this.setFulfilled()
				this.data = result

				if (this.options.page && this.options.pageSetterName && !this.options.isFetchUp) {
					(this.options.page as any)[this.options.pageSetterName]((p: number) => p + 1)
				}
			})
			.catch((err) => {
				this.status = "rejected"
				this.setRejected()
				this.error = err
			})

		return this
	};

	value = (): T | {} | null => this.status === "fulfilled" ? this.data : null

	errorMessage = (): string | null => {
		return this.status === "rejected"
			? this.error?.message || "An error occurred, or base data not provided"
			: null
	};

	private setFulfilled = () => {
		this.isFulfilled = true
		this.isPending = false
		this.isRejected = false
	};

	private setRejected = () => {
		this.isRejected = true
		this.isFulfilled = false
		this.isPending = false
	};

	private setPending = () => {
		this.isFulfilled = false
		this.isPending = true
		this.isRejected = false
	};
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
 * const count = mobxState(0)('count');
 *
 * // Теперь можно использовать `counter.counter` для получения значения
 * и counter.setCounter(newValue | (prevValue) => newValue) для его изменения.
 * или const { count: { count, setCount } } = counterStore
 * 
 * Так-же вы можете использовать настройку { reset: true }
 * @example
 * const count = mobxState(0)('count', { reset: true })
 * 
 * Теперь ваше состояние 'count' будет автоматически сбрасываться до начального значения переданного в первом аргументе.
 * Сброс будет происходить лишь в том случае если вы окажетесь в области где ваше состояние не наблюдается
 *
 * @param initialValue - начальное значение
 * @param annotations - объект аннотаций MobX, использовать как { переданное имя: observable... }
 * @param options - дополнительные опции для makeAutoObservable (например, autoBind, deep...)
 * @returns Функция, которая принимает параметр `name` и возвращает объект состояния с геттером и сеттером этого же `name`.
 */
export function mobxState<T>(
	initialValue: T,
	annotations: Record<string, any> = {},
	makeObservableOptions: MakeObservableOptions = {}
) {
	return <K extends string>(name: K, options?: MobxStateOptions): MobxStateWithGetterAndSetter<K, T> => {
		return new MobxState<K, T>(initialValue, name, annotations, makeObservableOptions, options) as MobxStateWithGetterAndSetter<K, T>
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
	annotations: AnnotationsMap<{ [key: string]: any }, never> = {},
) => {
	return <K extends NestedKeyOf<T>>(
		id: string | number,
		key: K,
		updater: UpdaterT<T, K>
	) => {
		(new MobxUpdater(annotations)).updateState(arrayOrObject, id, key, updater)
	}
}

// ========================== MOBX-SAI-FETCH ==============================

/**
 * Делает запрос и предоставляет куча удобств :)
 * 
 * Телеграм: https://t.me/nics51
 *
 * @example
 * // some-store.ts
 * saiData: MobxSaiInstance<TestFetchData> = {}
 * saiDataPage = mobxState(1)('saiDataPage')
 * isFetchUp = mobxState(false)('isFetchUp')
 * 
 * getSaiMessageAction = async () => {
 * 	const { messagePage, messageLimit } = messageApiStore
 * 	const { selectedChat } = chatStore
 * 
 * 	try {
 * 		const body = {
 * 			page: messagePage,
 * 			limit: messageLimit
 * 		}
 * 		this.saiData = mobxSaiFetch(getMessage({ page: messagePage, limit: messageLimit }))
 * 	} catch (err) { console.log(err) }
 * }
 * 
 * // SomeComponents.tsx
 * const {
 * 	saiData: {
 * 		data,
 * 		status
 * 	}
 * } = someStore
 * 
 * return (
 * 	<>
 * 		{status == "pending" ? (
 * 			<div>Loading...</div>
 * 		) : data?.message?.map((item) => (
 * 			<div key={item.id}>
 * 				<span>{item.content}</span>
 * 			</div>
 * 		))}
 * 	</>
 * )
 * 
 * Вообще эта функция имеет еще третий второй параметрм, options. Это настройки которые облегчат вам жизнь в разработке на архитектуре SAI да и в целом при работе с мобиксом. Соу да, ознакомьтесь пожалуйста с этим
 *	
 *	`id` - Обязателен если хотите использовать options
 *	
 *	`page` - Это должно быть состояние от mobxState из этой-же библиотеки, нужна чтобы обновлять page (если у вас в fetchType указано "pagination")
 *	
 *	`pageSetterName` - Название во втором параметре mobxState у вашего page, тоесть например page = mobxState(1)("privet") вам нужно здесь передать "privet"
 *	
 *	`isFetchUp` - Флаг отвечающий за то делать ли page + 1 или page - 1
 *	
 *	`fetchType` - По умолчанию ваще имеет "default" но если хотите с пагинацией то "pagination"
 *	
 *	`fetchIfPending` - Отвечает за то, будут ли воспроизводится запросы в тот момент когда запрос уже идёт. Тоесть если вы укажете true то у вас будут запросы без остановки и ожидания. По умолчанию стоит false (Позаботился о джунам авхвааахв)
 *	
 *	`fetchIfHaveData` - Если указать false то запрос не будет идти если у вас уже есть ответ с предыдущего запроса, по умолчанию true
 *	
 *	
 * @example
 * this.saiData = mobxSaiFetch(
 * 	getMessage.bind(null, { page: messagePage, limit: messageLimit },
 * 	{
 * 		id: selectedChatId,
 * 		page: this.saiDataPage,
 * 		pageSetterName: "saiDataPage",
 * 		isFetchUp: false,
 * 		fetchType: "pagination",
 * 		fetchIfPending: false,
 * 		fetchIfHaveData: false
 * 	}
 * )
 * 
 * Теперь этот код будет:
 * Добавлять +1 в page при пагинации вниз. Не будет делать запрос если запрос уже есть. Не будет делать запрос если уже есть ответ от предыдущего запроса
 *	
 * @param initialValue - начальное значение
 * @param annotations - объект аннотаций MobX, использовать как { переданное имя: observable... }
 * @param options - дополнительные опции для makeAutoObservable (например, autoBind, deep...)
 * @returns Функция, которая принимает параметр `name` и возвращает объект состояния с геттером и сеттером этого же `name`.
 */
export function mobxSaiFetch<T>(
	promiseOrFunction: Promise<T> | (() => Promise<T>),
	options: MobxSaiFetchOptions = {}
): MobxSaiInstance<T> {
	const { id, fetchIfPending = false, fetchIfHaveData = true } = options

	if (id && fetchCache.has(id)) {
		const instance = fetchCache.get(id) as MobxSaiInstance<T>
		const { isPending, data } = instance
		if (!fetchIfPending && isPending) {
			console.warn("Fetch is already pending and fetchIfPending is false.")
			return instance
		}
		if (!fetchIfHaveData && data) {
			console.warn("Data already exists and fetchIfHaveData is false.")
			return instance
		}
		if (options.page && options.pageSetterName && options.isFetchUp) {
			(options.page as any)[options.pageSetterName]((p: number) => p - 1)
		}
		if (instance.fetch) instance.fetch(promiseOrFunction)
		else throw new Error("Fetch method is not defined on the instance.")
		return instance
	}

	const instance = (new MobxSaiFetch<T>(options)) as MobxSaiInstance<T>

	if (promiseOrFunction instanceof Promise) {
		if (instance.fetch) instance.fetch(() => promiseOrFunction)
		else throw new Error("Fetch method is not defined on the instance.")
	} else if (typeof promiseOrFunction === "function") {
		if (instance.fetch) instance.fetch(promiseOrFunction)
		else throw new Error("Fetch method is not defined on the instance.")
	} else throw new Error("Invalid argument passed to mobxSaiFetch.")

	if (id) fetchCache.set(id, instance)
	return instance
}