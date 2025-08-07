"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mobxDebouncer = exports.useMobxUpdate = exports.m = exports.MobxDebouncer = void 0;
exports.mobxState = mobxState;
exports.useMobxForm = useMobxForm;
exports.mobxSaiFetch = mobxSaiFetch;
exports.clearMobxSaiFetchCache = clearMobxSaiFetchCache;
exports.mobxSaiHandler = mobxSaiHandler;
const mobx_1 = require("mobx");
const validators_1 = require("./validators");
__exportStar(require("./types"), exports);
// ========================== MOBX STATE ==============================
class MobxState {
    constructor(initialValue, name, options = {}) {
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        const resetValue = initialValue;
        this[name] = initialValue;
        this[`set${capitalizedName}`] = (newValue) => {
            if (typeof newValue === "function") {
                this[name] = newValue(this[name]);
            }
            else {
                this[name] = newValue;
            }
        };
        (0, mobx_1.makeObservable)(this, {
            [name]: mobx_1.observable,
            [`set${capitalizedName}`]: mobx_1.action,
        });
        if (options.reset) {
            (0, mobx_1.onBecomeUnobserved)(this, name, () => {
                this[name] = resetValue;
            });
        }
    }
}
// ========================== VALIDATION SCHEMA ==============================
class ValidationSchema extends validators_1.ValidatorBuilder {
    constructor() {
        super(...arguments);
        this.validators = {};
    }
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
    schema(validators) {
        const schema = new ValidationSchema();
        schema.validators = validators;
        return schema;
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
    extend(newValidators, override = false) {
        for (const field in newValidators) {
            if (override || !this.validators[field])
                this.validators[field] = newValidators[field];
            else
                this.validators[field] = this.validators[field].concat(newValidators[field]);
        }
        return this;
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
    pick(keys) {
        const pickedValidators = {};
        for (const key of keys) {
            if (this.validators[key]) {
                pickedValidators[key] = this.validators[key];
            }
        }
        return this.schema(pickedValidators);
    }
    validate(values) {
        const errors = {};
        let success = true;
        for (const field in this.validators) {
            const validators = this.validators[field];
            for (const validate of validators) {
                const validationResult = validate(values[field], values);
                if (validationResult !== true) {
                    success = false;
                    errors[field + 'Err'] = typeof validationResult === 'string'
                        ? validationResult
                        : `Invalid value for ${field}`;
                    break;
                }
            }
        }
        return { success, errors };
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
};
class FormState {
    constructor(initialValues, validationSchema, options) {
        this.errors = {};
        this.options = { instaValidate: true, validateAllOnChange: false, inputResetErr: true };
        this.disabled = false;
        /**
     * Сеттер значений
     *
     * Телеграм: https://t.me/nics51
     *
     */
        this.setValue = (field, value) => {
            this.values[field] = value;
            // @ts-ignore
            if (this.options.inputResetErr)
                this.errors[`${field}Err`] = '';
            if (this.options.instaValidate) {
                const error = this.validationSchema.validate(this.values);
                this.disabled = !error.success;
                if (this.options.validateAllOnChange)
                    this.errors = error.errors;
                else
                    this.errors = Object.assign(Object.assign({}, this.errors), { [field + 'Err']: error.errors[field + 'Err'] });
            }
            if (value == '' && this.options.resetErrIfNoValue) {
                this.errors = Object.assign(Object.assign({}, this.errors), { [field + 'Err']: '' });
                this.disabled = this.disabled = Object.values(this.errors).some(error => error !== '');
            }
        };
        this.initialValues = initialValues;
        this.values = initialValues;
        this.validationSchema = validationSchema;
        this.options = Object.assign(Object.assign({}, formStateDefaultOptions), options);
        if (options.disabled)
            this.disabled = options.disabled;
        (0, mobx_1.makeAutoObservable)(this, options.observableAnnotations || {}, options.observableOptions || {});
    }
    /**
 * Сеттер ошибок
 *
 * Телеграм: https://t.me/nics51
 *
 */
    setError(field, error) {
        // @ts-ignore
        this.errors[`${field}Err`] = error || '';
    }
    /**
 * Возвращает все инпуты к начальному состоянию
 *
 * Телеграм: https://t.me/nics51
 *
 */
    reset() {
        this.values = Object.assign({}, this.initialValues);
        this.errors = {};
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
    validate() {
        const result = this.validationSchema.validate(this.values);
        if (!result.success)
            this.errors = result.errors;
        else
            this.errors = {};
        this.disabled = !result.success;
        return result.success;
    }
}
// ========================== USE MOBX UPDATER ==============================
class MobxUpdater {
    constructor(annotations = {}) {
        (0, mobx_1.makeAutoObservable)(this, annotations, { autoBind: true });
    }
    /**
     * Метод для получения функции обновления для массива или объекта
     *
     * @param arrayOrObject - Массив или объект, который нужно обновить.
     * @returns Функция для обновления состояния.
     */
    getUpdater(arrayOrObject) {
        return (id, key, updater) => {
            this.updateState(arrayOrObject, id, key, updater);
        };
    }
    /**
     * Метод для обновления состояния элемента в массиве или объекте.
     *
     * @param arrayOrObject - Массив или объект, который нужно обновить.
     * @param id - Идентификатор элемента для обновления.
     * @param key - Ключ или путь для обновления.
     * @param updater - Функция обновления или новое значение для обновления.
     */
    updateState(arrayOrObject, id, key, updater, idKey) {
        const item = Array.isArray(arrayOrObject)
            ? arrayOrObject.find((item) => (item === null || item === void 0 ? void 0 : item[idKey || 'id']) === id)
            : arrayOrObject[id];
        if (item)
            this.deepUpdate(item, key, updater);
    }
    /**
 * Вспомогательный метод для выполнения глубокого обновления по пути.
 * Если путь или ключ отсутствует, они будут созданы.
 *
 * @param obj - Объект, в котором нужно выполнить обновление.
 * @param key - Путь или ключ, по которому будет выполнено обновление.
 * @param updater - Функция или новое значение для обновления.
 */
    deepUpdate(obj, key, updater) {
        const keys = key.split(".");
        const lastKey = keys.pop();
        const target = keys.reduce((acc, k) => {
            if (k.includes("[")) {
                const [arrayKey, index] = k.split(/\[|\]/).filter(Boolean);
                if (!acc[arrayKey])
                    acc[arrayKey] = [];
                if (!acc[arrayKey][Number(index)])
                    acc[arrayKey][Number(index)] = {};
                return acc[arrayKey][Number(index)];
            }
            if (!acc[k])
                acc[k] = {};
            return acc[k];
        }, obj);
        if (target && lastKey) {
            if (typeof updater === "function") {
                const prevValue = target[lastKey];
                target[lastKey] = updater(prevValue);
            }
            else
                target[lastKey] = updater;
        }
    }
}
// ========================== MOBX SAI FETCH ==============================
const fetchCache = new Map();
const defaultOptions = {
    id: "default",
    page: null,
    pageSetterName: null,
    isFetchUp: false,
    fetchType: "default",
    fetchIfPending: false,
    fetchIfHaveData: true,
    isSetData: true,
    needPending: true,
    cacheSystem: {
        limit: null,
        setCache: () => { }
    },
    dataScope: {
        class: null,
        startFrom: 'top',
        topPercentage: null,
        botPercentage: null,
        relativeParamsKey: null,
        setParams: null,
        upOrDownParamsKey: null,
        isHaveMoreResKey: null,
        howMuchGettedToTop: 2
    },
    fetchAddTo: {
        path: '',
        addTo: 'reset',
        isSetReversedArr: false,
        isSetPrevArr: false,
        setArrCallback: null
    },
};
class MobxSaiFetch {
    constructor(options) {
        this.isPending = false;
        this.isFulfilled = false;
        this.isRejected = false;
        this.status = "pending";
        this.data = null;
        this.error = null;
        this.addedToEndCount = 0;
        this.addedToStartCount = 0;
        this.fetchedCount = 0;
        this.scrollProgress = 0;
        this.gettedToTop = mobxState(0)('gettedToTop');
        this.botStatus = "";
        this.topStatus = "";
        this.scrollCachedData = mobxState([])('scrollCachedData');
        this.isBotPending = false;
        this.isBotRejected = false;
        this.isBotFulfulled = false;
        this.isTopPending = false;
        this.isTopRejected = false;
        this.isTopFulfulled = false;
        this.topError = null;
        this.botError = null;
        this.isHaveMoreBot = mobxState(true)('isHaveMoreBot');
        this.isHaveMoreTop = mobxState(true)('isHaveMoreTop');
        this.oldOptions = null;
        this.promiseOrFunction = null;
        this.setPromiseOrFunction = (promise) => this.promiseOrFunction = promise;
        this.options = defaultOptions;
        this.fetch = (promiseOrFunction, fromWhere, fetchWhat = null) => {
            const { gettedToTop: { gettedToTop }, isHaveMoreBot: { setIsHaveMoreBot, isHaveMoreBot }, isHaveMoreTop: { setIsHaveMoreTop, isHaveMoreTop } } = this;
            const { dataScope: { startFrom, isHaveMoreResKey, howMuchGettedToTop }, fetchIfPending, fetchIfHaveData, fetchAddTo, needPending } = this.options;
            if (!fetchIfPending && this.isPending) {
                console.warn("Fetch is already pending and fetchIfPending is false.");
                return this;
            }
            if (!fetchIfHaveData && this.data && !fromWhere) {
                console.warn("Data already exists and fetchIfHaveData is false.");
                return this;
            }
            if (fetchWhat === 'bot' && !isHaveMoreBot) {
                console.warn("Skipping BOT fetch because isHaveMoreBot is false");
                return this;
            }
            if (fetchWhat === 'top' && !isHaveMoreTop) {
                console.warn("Skipping TOP fetch because isHaveMoreTop is false");
                return this;
            }
            if (fromWhere == null && fetchWhat == null) {
                if (needPending) {
                    this.setPending();
                    this.status = "pending";
                }
                this.error = null;
            }
            const fetchPromise = promiseOrFunction instanceof Promise
                ? () => promiseOrFunction
                : promiseOrFunction;
            fetchPromise()
                .then((result) => {
                var _a, _b, _c, _d, _e, _f;
                if (fromWhere == null && fetchWhat == null) {
                    this.status = "fulfilled";
                    this.setFulfilled();
                    if (isHaveMoreResKey && typeof result === 'object' && result !== null && isHaveMoreResKey in result) {
                        setIsHaveMoreBot(result[isHaveMoreResKey]);
                    }
                }
                else {
                    if (fetchWhat == 'bot') {
                        this.setBotFulfilled();
                        if (isHaveMoreResKey && typeof result === 'object' && result !== null && isHaveMoreResKey in result) {
                            setIsHaveMoreBot(result[isHaveMoreResKey]);
                        }
                        else
                            console.warn(`BOT FETCH: Can't find isHaveMore from passed isHaveMoreResKey 'result[isHaveMoreResKey]'`);
                    }
                    if (fetchWhat == 'top') {
                        this.setTopFulfilled();
                        if (isHaveMoreResKey && typeof result === 'object' && result !== null && isHaveMoreResKey in result) {
                            setIsHaveMoreTop(result[isHaveMoreResKey]);
                        }
                        else
                            console.warn(`TOP FETCH: Can't find isHaveMore from passed isHaveMoreResKey 'result[isHaveMoreResKey]'`);
                    }
                }
                if (fetchAddTo && fetchAddTo.path && typeof this.data === "object" && this.data !== null) {
                    // @ts-ignore
                    if (Array.isArray(this.getPathValue(this.data, fetchAddTo.path)) && Array.isArray(result[fetchAddTo.path])) {
                        // SCROLL CACHE SYSTEM 
                        if (gettedToTop <= -howMuchGettedToTop && startFrom == 'top') {
                            setIsHaveMoreTop(true);
                            if (fetchWhat == 'bot') {
                                // @ts-ignore
                                this.data[fetchAddTo.path].splice(0, this.options.cacheSystem.limit);
                            }
                            else {
                                // @ts-ignore
                                this.data[fetchAddTo.path] = [...this.data[fetchAddTo.path].slice(0, -this.options.cacheSystem.limit)];
                            }
                        }
                        if (fetchWhat == 'bot' && startFrom == 'top') {
                            if (gettedToTop === -howMuchGettedToTop) {
                                // @ts-ignore
                                const cachedList = this.data[fetchAddTo.path].slice(0, this.options.cacheSystem.limit);
                                this.scrollCachedData.setScrollCachedData(cachedList);
                            }
                        }
                        if (fetchWhat == 'top' && startFrom == 'bot') {
                            if (gettedToTop === howMuchGettedToTop) {
                                // @ts-ignore
                                const cachedList = this.data[fetchAddTo.path].slice(-this.options.cacheSystem.limit);
                                this.scrollCachedData.setScrollCachedData(cachedList);
                            }
                        }
                        const targetArray = this.getPathValue(this.data, fetchAddTo.path);
                        switch (fetchAddTo.addTo) {
                            case "start":
                                this.setAddedToStartCount('+');
                                if (fetchAddTo.setArrCallback) {
                                    fetchAddTo.setArrCallback(prev => {
                                        // @ts-ignore
                                        return (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) ? [...result[fetchAddTo.path], ...prev].reverse() : [...result[fetchAddTo.path].reverse(), ...prev];
                                    });
                                }
                                if (!((_a = this.options) === null || _a === void 0 ? void 0 : _a.isSetData))
                                    return;
                                // @ts-ignore
                                this.setPathValue(this.data, fetchAddTo.path, [...result[fetchAddTo.path], ...targetArray]);
                                break;
                            case "end":
                                this.setAddedToEndCount('+');
                                if (fetchAddTo.setArrCallback) {
                                    fetchAddTo.setArrCallback(prev => {
                                        // @ts-ignore
                                        return (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) ? [...prev, ...result[fetchAddTo.path]].reverse() : [...prev, ...result[fetchAddTo.path]];
                                    });
                                }
                                if (!((_b = this.options) === null || _b === void 0 ? void 0 : _b.isSetData))
                                    return;
                                // @ts-ignore
                                this.setPathValue(this.data, fetchAddTo.path, [...targetArray, ...result[fetchAddTo.path]]);
                                break;
                            case "reset":
                            default:
                                if (fetchAddTo.setArrCallback) {
                                    if (fetchAddTo.path) {
                                        // @ts-ignore
                                        fetchAddTo.setArrCallback((fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) ? (_c = [...result[fetchAddTo.path]]) === null || _c === void 0 ? void 0 : _c.reverse() : result[fetchAddTo.path]);
                                    }
                                    else {
                                        fetchAddTo.setArrCallback(result);
                                    }
                                }
                                if (!((_d = this.options) === null || _d === void 0 ? void 0 : _d.isSetData))
                                    return;
                                this.setPathValue(this.data, fetchAddTo.path, result);
                        }
                    }
                    else {
                        this.setFetchedCount('+');
                        if (fetchAddTo.setArrCallback) {
                            if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.path) {
                                fetchAddTo.setArrCallback(prev => {
                                    var _a, _b, _c;
                                    if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetPrevArr) {
                                        if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) {
                                            // @ts-ignore
                                            return (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.addTo) == 'start' ? [...prev, ...(_a = [...result[fetchAddTo.path]]) === null || _a === void 0 ? void 0 : _a.reverse()] : [...(_b = [...result[fetchAddTo.path]]) === null || _b === void 0 ? void 0 : _b.reverse(), ...prev];
                                        }
                                        // @ts-ignore
                                        return (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.addTo) == 'start' ? [...prev, ...result[fetchAddTo.path]] : [...result[fetchAddTo.path], ...prev];
                                    }
                                    if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) {
                                        // @ts-ignore
                                        return (_c = result[fetchAddTo.path]) === null || _c === void 0 ? void 0 : _c.reverse();
                                    }
                                    // @ts-ignore
                                    return result[fetchAddTo.path];
                                });
                            }
                            else {
                                fetchAddTo.setArrCallback(result);
                            }
                        }
                        if (!((_e = this.options) === null || _e === void 0 ? void 0 : _e.isSetData))
                            return;
                        this.data = result;
                    }
                }
                else {
                    this.setFetchedCount('+');
                    if (fetchAddTo.setArrCallback) {
                        if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.path) {
                            fetchAddTo.setArrCallback(prev => {
                                var _a, _b, _c, _d, _e;
                                if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetPrevArr) {
                                    // @ts-ignore
                                    const arrCount = [...prev, ...[...result[fetchAddTo.path]]].length;
                                    if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) {
                                        // @ts-ignore
                                        const newList = (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.addTo) == 'start' ? [...prev, ...(_a = [...result[fetchAddTo.path]]) === null || _a === void 0 ? void 0 : _a.reverse()] : [...(_b = [...result[fetchAddTo.path]]) === null || _b === void 0 ? void 0 : _b.reverse(), ...prev];
                                        if (this.options.cacheSystem.limit) {
                                            if (arrCount >= this.options.cacheSystem.limit && ((_c = this.options.cacheSystem) === null || _c === void 0 ? void 0 : _c.setCache)) {
                                                // @ts-ignore
                                                this.options.cacheSystem.setCache(newList);
                                            }
                                        }
                                        return newList;
                                    }
                                    // @ts-ignore
                                    const newList = (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.addTo) == 'start' ? [...prev, ...result[fetchAddTo.path]] : [...result[fetchAddTo.path], ...prev];
                                    if (this.options.cacheSystem.limit) {
                                        if (arrCount >= this.options.cacheSystem.limit && ((_d = this.options.cacheSystem) === null || _d === void 0 ? void 0 : _d.setCache)) {
                                            // @ts-ignore
                                            this.options.cacheSystem.setCache(newList);
                                        }
                                    }
                                    return newList;
                                }
                                // @ts-ignore
                                const newList = result[fetchAddTo.path];
                                const arrCount = newList === null || newList === void 0 ? void 0 : newList.length;
                                if (this.options.cacheSystem.limit) {
                                    if (arrCount >= this.options.cacheSystem.limit && ((_e = this.options.cacheSystem) === null || _e === void 0 ? void 0 : _e.setCache)) {
                                        // @ts-ignore
                                        this.options.cacheSystem.setCache((fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) ? newList === null || newList === void 0 ? void 0 : newList.reverse() : newList);
                                    }
                                }
                                if (fetchAddTo === null || fetchAddTo === void 0 ? void 0 : fetchAddTo.isSetReversedArr) {
                                    return newList === null || newList === void 0 ? void 0 : newList.reverse();
                                }
                                return newList;
                            });
                        }
                        else {
                            fetchAddTo.setArrCallback(result);
                        }
                    }
                    if (!((_f = this.options) === null || _f === void 0 ? void 0 : _f.isSetData))
                        return;
                    this.data = result;
                }
                if (this.options.page && this.options.pageSetterName && !this.options.isFetchUp) {
                    this.options.page[this.options.pageSetterName]((p) => p + 1);
                }
            })
                .catch((err) => {
                if (fromWhere == null && fetchWhat == null) {
                    this.status = "rejected";
                    this.setRejected();
                    this.error = err;
                }
                else {
                    if (fetchWhat == 'bot')
                        this.setBotRejected(err);
                    if (fetchWhat == 'top')
                        this.setTopRejected(err);
                }
            })
                .finally(() => {
                if (this.oldOptions) {
                    this.options = this.oldOptions;
                }
            });
            return this;
        };
        this.isFetched = () => {
            return !!this.data;
        };
        this.setAddedToEndCount = (which) => {
            this.setFetchedCount('+');
            if (typeof which == 'number')
                this.addedToEndCount = which;
            if (which == '+')
                this.addedToEndCount = this.addedToEndCount + 1;
            else
                this.addedToEndCount = this.addedToEndCount - 1;
        };
        this.setAddedToStartCount = (which) => {
            this.setFetchedCount('+');
            if (typeof which == 'number')
                this.addedToStartCount = which;
            if (which == '+')
                this.addedToStartCount = this.addedToStartCount + 1;
            else
                this.addedToStartCount = this.addedToStartCount - 1;
        };
        this.setFetchedCount = (which) => {
            if (typeof which == 'number')
                this.fetchedCount = which;
            if (which == '+')
                this.fetchedCount = this.fetchedCount + 1;
            else
                this.fetchedCount = this.fetchedCount - 1;
        };
        this.getPathValue = (obj, path) => {
            return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
        };
        this.setPathValue = (obj, path, value) => {
            const keys = path.split(".");
            let temp = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!temp[keys[i]])
                    temp[keys[i]] = {};
                temp = temp[keys[i]];
            }
            temp[keys[keys.length - 1]] = value;
        };
        this.setFulfilled = () => {
            this.isFulfilled = true;
            this.isPending = false;
            this.isRejected = false;
        };
        this.setRejected = () => {
            this.isRejected = true;
            this.isFulfilled = false;
            this.isPending = false;
        };
        this.setPending = () => {
            this.isFulfilled = false;
            this.isPending = true;
            this.isRejected = false;
        };
        this.setTopPending = () => {
            this.topStatus = 'pending';
            this.isTopPending = true;
            this.isTopRejected = false;
            this.isTopFulfulled = false;
        };
        this.setTopRejected = (err) => {
            this.topError = err;
            this.topStatus = 'rejected';
            this.isTopPending = false;
            this.isTopRejected = true;
            this.isTopFulfulled = false;
        };
        this.setTopFulfilled = () => {
            this.topStatus = 'fulfilled';
            this.isTopPending = false;
            this.isTopRejected = false;
            this.isTopFulfulled = true;
        };
        this.setBotPending = () => {
            this.botStatus = 'pending';
            this.isBotPending = true;
            this.isBotRejected = false;
            this.isBotFulfulled = false;
        };
        this.setBotRejected = (err) => {
            this.botError = err;
            this.botStatus = 'rejected';
            this.isBotPending = false;
            this.isBotRejected = true;
            this.isBotFulfulled = false;
        };
        this.setBotFulfilled = () => {
            this.botStatus = 'fulfilled';
            this.isBotPending = false;
            this.isBotRejected = false;
            this.isBotFulfulled = true;
        };
        this.reset = () => {
            this.isPending = false;
            this.isFulfilled = false;
            this.isRejected = false;
            this.status = "pending";
            this.data = null;
            this.error = null;
            this.addedToEndCount = 0;
            this.addedToStartCount = 0;
            this.fetchedCount = 0;
            this.scrollProgress = 0;
            this.gettedToTop.setGettedToTop(0);
            this.scrollCachedData.setScrollCachedData([]);
            this.botStatus = "";
            this.topStatus = "";
            this.isBotPending = false;
            this.isBotRejected = false;
            this.isBotFulfulled = false;
            this.isTopPending = false;
            this.isTopRejected = false;
            this.isTopFulfulled = false;
            this.topError = null;
            this.botError = null;
            this.isHaveMoreBot.setIsHaveMoreBot(true);
            this.isHaveMoreTop.setIsHaveMoreTop(true);
            this.oldOptions = null;
            return this;
        };
        this.options = Object.assign(Object.assign(Object.assign(Object.assign({}, this.options), defaultOptions), options), { cacheSystem: Object.assign(Object.assign(Object.assign({}, this.options.cacheSystem), defaultOptions.cacheSystem), options.cacheSystem), dataScope: Object.assign(Object.assign(Object.assign({}, this.options.dataScope), defaultOptions.dataScope), options.dataScope), fetchAddTo: Object.assign(Object.assign(Object.assign({}, this.options.fetchAddTo), defaultOptions.fetchAddTo), options.fetchAddTo) });
        (0, mobx_1.makeAutoObservable)(this, {}, { autoBind: true });
        this.setupScrollTracking();
        if (!this.options.needPending) {
            this.status = "fulfilled";
        }
    }
    setupScrollTracking() {
        var _a, _b, _c, _d;
        if (!((_a = this.options.dataScope) === null || _a === void 0 ? void 0 : _a.class) && !((_b = this.options.dataScope) === null || _b === void 0 ? void 0 : _b.scrollRef))
            return;
        if (((_c = this.options.dataScope) === null || _c === void 0 ? void 0 : _c.class) && typeof document !== 'undefined') {
            const element = document.querySelector(`.${this.options.dataScope.class}`);
            if (!element) {
                console.warn("Scroll tracking element not found.");
                return;
            }
            const updateScrollProgress = () => {
                const { scrollTop, scrollHeight, clientHeight } = element;
                this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
            };
            element.addEventListener("scroll", updateScrollProgress);
        }
        // React Native
        else if ((_d = this.options.dataScope) === null || _d === void 0 ? void 0 : _d.scrollRef) {
            const handleScroll = (event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                const scrollTop = contentOffset.y;
                const scrollHeight = contentSize.height;
                const clientHeight = layoutMeasurement.height;
                this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
            };
            this.options.dataScope.onScroll = handleScroll;
        }
    }
    handleScrollUpdate(scrollTop, scrollHeight, clientHeight) {
        var _a, _b, _c, _d, _e, _f;
        const { topPercentage, botPercentage, startFrom } = this.options.dataScope;
        const { gettedToTop: { gettedToTop, setGettedToTop }, isHaveMoreBot: { isHaveMoreBot, setIsHaveMoreBot }, isHaveMoreTop: { isHaveMoreTop, setIsHaveMoreTop }, options: { dataScope: { relativeParamsKey, upOrDownParamsKey, howMuchGettedToTop } }, isTopPending, isBotPending, } = this;
        this.scrollProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
        // === FETCH TOP ===
        if (topPercentage !== null &&
            this.scrollProgress <= topPercentage &&
            !isTopPending &&
            isHaveMoreTop) {
            if (startFrom == 'top' && gettedToTop >= -(howMuchGettedToTop - 1))
                return;
            console.log("FETCH TOP");
            setGettedToTop(p => {
                if ((p + 1) >= howMuchGettedToTop + 1)
                    setIsHaveMoreBot(true);
                return p + 1;
            });
            this.setTopPending();
            // @ts-ignore
            if ((_e = (_d = (_a = this === null || this === void 0 ? void 0 : this.data) === null || _a === void 0 ? void 0 : _a[(_c = (_b = this === null || this === void 0 ? void 0 : this.options) === null || _b === void 0 ? void 0 : _b.fetchAddTo) === null || _c === void 0 ? void 0 : _c.path]) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.id) {
                console.warn(`We can't find your relative Id`);
                return;
            }
            this.oldOptions = this.options;
            this.options = Object.assign(Object.assign({}, this.options), { isSetData: true, fetchAddTo: Object.assign(Object.assign({}, this.options.fetchAddTo), { addTo: 'start' }) });
            this.options.dataScope.setParams((prev) => {
                const newParams = prev;
                // @ts-ignore
                if (relativeParamsKey)
                    newParams[relativeParamsKey] = this.data[this.options.fetchAddTo.path][0].id;
                if (upOrDownParamsKey)
                    newParams[upOrDownParamsKey] = true;
                return newParams;
            });
            if (this.promiseOrFunction)
                this.fetch(this.promiseOrFunction, 'fromScroll', 'top');
        }
        // === FETCH BOT ===
        if (botPercentage !== null &&
            this.scrollProgress >= botPercentage &&
            !isBotPending &&
            this.data &&
            this.options.fetchAddTo.path &&
            // @ts-ignore
            this.data[this.options.fetchAddTo.path] &&
            this.options.dataScope.setParams &&
            isHaveMoreBot) {
            if (startFrom == 'bot' && gettedToTop <= howMuchGettedToTop)
                return;
            console.log("FETCH BOT");
            setGettedToTop(p => {
                if ((p - 1) <= howMuchGettedToTop - 1)
                    setIsHaveMoreTop(true);
                return p - 1;
            });
            this.setBotPending();
            // @ts-ignore
            if (!this.data[this.options.fetchAddTo.path][((_f = this.data[this.options.fetchAddTo.path]) === null || _f === void 0 ? void 0 : _f.length) - 1].id) {
                console.warn(`We can't find your relative Id`);
                return;
            }
            this.oldOptions = this.options;
            this.options = Object.assign(Object.assign({}, this.options), { isSetData: true, fetchAddTo: Object.assign(Object.assign({}, this.options.fetchAddTo), { addTo: 'end' }) });
            this.options.dataScope.setParams((prev) => {
                var _a;
                const newParams = prev;
                // @ts-ignore
                if (relativeParamsKey)
                    newParams[relativeParamsKey] = this.data[this.options.fetchAddTo.path][((_a = this.data[this.options.fetchAddTo.path]) === null || _a === void 0 ? void 0 : _a.length) - 1].id;
                if (upOrDownParamsKey)
                    newParams[upOrDownParamsKey] = false;
                return newParams;
            });
            if (this.promiseOrFunction)
                this.fetch(this.promiseOrFunction, 'fromScroll', 'bot');
        }
    }
    setScrollRef(scrollRef) {
        if (this.options.dataScope) {
            this.options.dataScope.scrollRef = scrollRef;
            const handleScroll = (event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                const scrollTop = contentOffset.y;
                const scrollHeight = contentSize.height;
                const clientHeight = layoutMeasurement.height;
                this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
            };
            this.options.dataScope.onScroll = handleScroll;
        }
        return this;
    }
}
// ========================= MOBX DEBOUNCER ==============================
/**
 * Класс для управления отложенными действиями в MobX
 * Позволяет группировать и откладывать выполнение действий
 */
class MobxDebouncer {
    constructor() {
        this.debouncedActions = new Map();
        this.actionRegistry = new Map();
        /**
         * Позволяет создавать сложные debounce системы в одну строчку, с любыми операциями :)
         *
         * Телеграм: https://t.me/nics51
         *
         * @example
         * // some-store.ts
         * class PostInteractionsStore {
         * 	constructor() {
         * 		makeAutoObservable(this)
         * 	}
         *
         * 	postUpdater: null | any = null
         * 	setPostUpdater = (updater: any) => this.postUpdater = updater
         *
         * 	toggleLikePost = (postId: number, post: GetPostFeedResponse) => {
         * 		if (!this.postUpdater) return
         *
         * 		runInAction(() => {
         * 			this.postUpdater(postId, "likesCount", (prev: number) => prev + (post?.isLiked ? -1 : 1))
         * 			this.postUpdater(postId, "isLiked", (prev: boolean) => !prev)
         * 		})
         *
         * 		mobxDebouncer.debouncedAction(
         * 			postId,
         * 			() => console.log("КОЛЛБЭК"),
         * 			1000,
         * 			'like-fav'
         * 		)
         * 	}
         *
         * 	toggleFavPost = (postId: number, post: GetPostFeedResponse) => {
         * 		if (!this.postUpdater) return
         *
         * 		runInAction(() => {
         * 			this.postUpdater(postId, "favoritesCount", (prev: number) => prev + (post?.isFavorited ? -1 : 1))
         * 			this.postUpdater(postId, "isFavorited", (prev: boolean) => !prev)
         * 		})
         *
         * 		mobxDebouncer.debouncedAction(
         * 			postId,
         * 			() => console.log("КОЛЛБЭК"),
         * 			1000,
         * 			'like-fav'
         * 		)
         * 	}
         * }
         *
         * Теперь при каждом вызове toggleLikePost или toggleFavPost будет сбрасываться таймер и вызываться коллбэк через 1 секунду после остановки вызовов toggleLikePost и toggleFavPost
         *
         * @param key - Уникальный идентификатор объекта (например, ID поста)
         * @param action - Функция, которую нужно выполнить
         * @param delay - Задержка в миллисекундах
         * @param groupKey - Ключ группировки для объединения разных типов действий
         */
        this.debouncedAction = (key, action, delay = 500, groupKey = 'default') => {
            const actionKey = `${groupKey}_${key}`;
            this.actionRegistry.set(actionKey, new Set([action]));
            const currentState = this.debouncedActions.get(actionKey);
            if (currentState === null || currentState === void 0 ? void 0 : currentState.timerId) {
                clearTimeout(currentState.timerId);
            }
            const timerId = setTimeout(() => {
                (0, mobx_1.runInAction)(() => {
                    const actions = this.actionRegistry.get(actionKey);
                    if (actions) {
                        actions.forEach(act => act());
                        this.actionRegistry.delete(actionKey);
                    }
                    this.debouncedActions.delete(actionKey);
                });
            }, delay);
            this.debouncedActions.set(actionKey, {
                timerId,
                pendingActions: Array.from(this.actionRegistry.get(actionKey))
            });
        };
        /**
         * Немедленно выполняет все отложенные действия для указанного ключа
         *
         * @param key - Идентификатор объекта
         * @param groupKey - Ключ группировки
         */
        this.flushDebouncedActions = (key, groupKey = 'default') => {
            const actionKey = `${groupKey}_${key}`;
            const currentState = this.debouncedActions.get(actionKey);
            if (currentState === null || currentState === void 0 ? void 0 : currentState.timerId) {
                clearTimeout(currentState.timerId);
            }
            const actions = this.actionRegistry.get(actionKey);
            if (actions) {
                (0, mobx_1.runInAction)(() => {
                    actions.forEach(action => action());
                });
                this.actionRegistry.delete(actionKey);
            }
            this.debouncedActions.delete(actionKey);
        };
        /**
         * Отменяет все отложенные действия для указанного ключа без их выполнения
         *
         * @param key - Идентификатор объекта
         * @param groupKey - Ключ группировки
         */
        this.cancelDebouncedActions = (key, groupKey = 'default') => {
            const actionKey = `${groupKey}_${key}`;
            const currentState = this.debouncedActions.get(actionKey);
            if (currentState === null || currentState === void 0 ? void 0 : currentState.timerId) {
                clearTimeout(currentState.timerId);
            }
            this.actionRegistry.delete(actionKey);
            this.debouncedActions.delete(actionKey);
        };
        /**
         * Отменяет все отложенные действия по группе
         *
         * @param groupKey - Ключ группировки
         */
        this.cancelDebouncedActionsByGroup = (groupKey) => {
            const keysToDelete = [];
            for (const [key, value] of this.debouncedActions.entries()) {
                if (key.startsWith(`${groupKey}_`)) {
                    clearTimeout(value.timerId);
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => {
                this.actionRegistry.delete(key);
                this.debouncedActions.delete(key);
            });
        };
        /**
         * Отменяет все отложенные действия
         *
         */
        this.cancelAllDebouncedActions = () => {
            for (const [_, value] of this.debouncedActions.entries()) {
                clearTimeout(value.timerId);
            }
            this.actionRegistry.clear();
            this.debouncedActions.clear();
        };
    }
}
exports.MobxDebouncer = MobxDebouncer;
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
function mobxState(initialValue) {
    return (name, options) => {
        return new MobxState(initialValue, name, options);
    };
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
function useMobxForm(initialValues, validationSchema, options = {
    instaValidate: true,
    inputResetErr: true,
    validateAllOnChange: false,
    resetErrIfNoValue: true,
    disabled: false,
    observableAnnotations: {},
    observableOptions: {}
}) {
    return new FormState(initialValues, validationSchema, options);
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
exports.m = new ValidationSchema();
/**
 * Функция для удобнейшего обновления состояния массива или объекта.
 * (Работает только с массивами из MobX)
 *
 * Телеграм: https://t.me/nics51
 *
 * @example
 * const commentsUpdate: MobxUpdateInstance<Comment> = useMobxUpdate(commentsList)
 *
 * onClick={() => {
 * 	commentsUpdate(comment.id, "count", (prev) => prev+1) // prev++ НЕ РАБОТАЕТ
 * }
 *
 * Приятного использования ;)
 *
 * @param arrayOrObjectGetter - Массив или объект, который нужно обновить.
 * @param annotations - объект аннотаций MobX, использовать как { переданное имя: observable... }
 * @returns Функция для обновления состояния элемента.
 */
const useMobxUpdate = (arrayOrObjectGetter, annotations = {}) => {
    const updater = new MobxUpdater(annotations);
    return (id, key, updaterFn, idKey) => {
        const arrayOrObject = typeof arrayOrObjectGetter === 'function'
            ? arrayOrObjectGetter()
            : arrayOrObjectGetter;
        updater.updateState(arrayOrObject, id, key, updaterFn, idKey);
    };
};
exports.useMobxUpdate = useMobxUpdate;
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
 *	Есть еще более сложные настроечки
 *
 *	`isSetData` - Отвечает за то, вставлять ли полученную дату в data или нет
 *
 *	`cacheSystem` - {
 *		`limit` - Отвечает за то какой лимит у вас в каждом запросе, он обязателен для системы кэширования данных в области видимости
 *		`setCache` - Отвечает за то куда вставлять кэшированные данные, передавайте только состояние mobxState
 *	}
 *
 *	`dataScope` - {
 *		`class` - Класс вашего скроллера
 *		`startFrom` - Откуда начинается ваш скролл, снизу или сверху?
 *		`topPercentage` - Какой процент должен достигнуть ваш скролл чтобы сделать запрос навверх
 *		`botPercentage` - Какой процент должен достигнуть ваш скрол чтобы сделать запрос вниз
 *		`relativeParamsKey` - Где находится ваш ключ relativeId в params, для того чтобы mobxSaiFetch могла обратиться к этому ключу и обновлять его айди, делая следующий запрос с новыми значениями в параметре
 *		`setParams` - Сеттер для параметров, передавайте только mobxState
 *		`upOrDownParamsKey` - Где находится ваш up флаг в params, который отвечает за то, вверх получать данные или вниз от вашего relativeId
 *		`isHaveMoreResKey` - Где находится ваш isHaveMore флаг в ответе из запроса, который отвечает за то, есть ли больше данных сверху или внизу
 *		`howMuchGettedToTop` - Сколько раз нужно сделать фетч вверх, чтобы убрать данные в противоположной стороне и засунуть их в кэш
 *	}
 *
 *	`fetchAddTo` = {
 *		`path` - Путь к массиву из ответа запроса
 *		`addTo` - По умолчанию стоит reset, он отвечает за то, что ваши данные всегда будут сбрасываться, start и end отвечают за то куда будет вставлен полученный массив, в начало или конец вашего массива в data
 *		`isSetReversedArr` - Отвечает за то переворачивать ли ваш массив в ответе перед тем как пихать его в data или нет?
 *		`setArrCallback` - Позволяет вам дополнительно хранить ответ из запроса в другом состоянии (передавать только mobxState)
 *	}
 *
 * @example
 * const params = mobxState<GetChatProfileMediaParams>({
 * 	limit: this.chatMediaProfileLimit,
 * 	up: this.chatMediaProfileUp
 * })('params')

 * this.chatMediaProfile = mobxSaiFetch(
 * 	() => getChatProfileMedia(selectedChat?.chatId, params.params),
 * 		{
 * 			id: selectedChat?.chatId,
 * 			fetchIfHaveData: false,
 * 			cacheSystem: {
 * 				limit: this.chatMediaProfileLimit,
 * 				setCache: setChatMediaCache
 * 			},
 * 			dataScope: {
 * 				class: "chatProfileMediaScrollClassname0",
 * 				startFrom: 'top',
 * 				topPercentage: 20,
 * 				botPercentage: 80,
 * 				relativeParamsKey: 'relativeImageMessageId',
 * 				upOrDownParamsKey: 'up',
 * 				isHaveMoreResKey: 'isHaveMoreBotOrTop',
 * 				setParams: params.setParams
 * 			},
 * 			fetchAddTo: {
 * 				path: 'data',
 * 				addTo: 'start',
 * 				setArrCallback: setChatProfileMedias
 * 			}
 * 		}
 * )
 *
 * Этот код делает за вас работу области видимости) Обсудите все детали с бэкендером, но если вы фуллстэк разработчик то эта функция идеально подойдет вам
 *
 * @param initialValue - начальное значение
 * @param annotations - объект аннотаций MobX, использовать как { переданное имя: observable... }
 * @param options - дополнительные опции для makeAutoObservable (например, autoBind, deep...)
 * @returns Функция, которая принимает параметр `name` и возвращает объект состояния с геттером и сеттером этого же `name`.
 */
function mobxSaiFetch(promiseOrFunction, options = {}) {
    var _a, _b;
    const { id, fetchIfPending = false, fetchIfHaveData = true } = options;
    if (id && fetchCache.has(id)) {
        const instance = fetchCache.get(id);
        const { isPending, data } = instance;
        instance.options = Object.assign(Object.assign(Object.assign(Object.assign({}, instance.options), defaultOptions), options), { cacheSystem: Object.assign(Object.assign(Object.assign({}, instance.options.cacheSystem), defaultOptions.cacheSystem), options.cacheSystem), dataScope: Object.assign(Object.assign(Object.assign({}, instance.options.dataScope), defaultOptions.dataScope), options.dataScope), fetchAddTo: Object.assign(Object.assign(Object.assign({}, instance.options.fetchAddTo), defaultOptions.fetchAddTo), options.fetchAddTo) });
        if (!fetchIfPending && isPending) {
            console.warn("Fetch is already pending and fetchIfPending is false.");
            return instance;
        }
        if (!fetchIfHaveData && data) {
            console.warn("Data already exists and fetchIfHaveData is false.");
            return instance;
        }
        if (options.page && options.pageSetterName && options.isFetchUp) {
            options.page[options.pageSetterName]((p) => p - 1);
        }
        if (instance.fetch) {
            var cachedArr = [];
            if (((_a = options.cacheSystem) === null || _a === void 0 ? void 0 : _a.setCache) && !instance.data && ((_b = options.cacheSystem) === null || _b === void 0 ? void 0 : _b.limit)) {
                options.cacheSystem.setCache(prev => {
                    if ((prev === null || prev === void 0 ? void 0 : prev.length) == 0 || ((prev === null || prev === void 0 ? void 0 : prev.length) < options.cacheSystem.limit)) {
                        return prev;
                    }
                    cachedArr = prev;
                    return prev;
                });
                if ((cachedArr === null || cachedArr === void 0 ? void 0 : cachedArr.length) != 0) {
                    // @ts-ignore
                    const instanceWithCache = Object.assign(Object.assign({}, instance), { data: Object.assign(Object.assign({}, instance === null || instance === void 0 ? void 0 : instance.data), { [options.fetchAddTo.path]: cachedArr }) });
                    // @ts-ignore
                    return instanceWithCache;
                }
            }
            // @ts-ignore
            instance.setPromiseOrFunction(promiseOrFunction);
            instance.fetch(promiseOrFunction);
        }
        else
            throw new Error("Fetch method is not defined on the instance.");
        return instance;
    }
    const instance = (new MobxSaiFetch(options));
    if (promiseOrFunction instanceof Promise) {
        // @ts-ignore
        instance.setPromiseOrFunction(promiseOrFunction);
        if (instance.fetch)
            instance.fetch(() => promiseOrFunction);
        else
            throw new Error("Fetch method is not defined on the instance.");
    }
    else if (typeof promiseOrFunction === "function") {
        // @ts-ignore
        instance.setPromiseOrFunction(promiseOrFunction);
        if (instance.fetch)
            instance.fetch(promiseOrFunction);
        else
            throw new Error("Fetch method is not defined on the instance.");
    }
    else
        throw new Error("Invalid argument passed to mobxSaiFetch.");
    if (id)
        fetchCache.set(id, instance);
    return instance;
}
/**
 * Очищает кэш экземпляра класса MobxSaiFetch, что приводит все состояния к начальным значениям
 *
 * @param id - id запроса (Необязательный)
 */
function clearMobxSaiFetchCache(id) {
    if (id)
        fetchCache.delete(id);
    else
        fetchCache.clear();
}
// ========================== MOBX DEBOUNCER ==============================
/**
 * Позволяет создавать сложные debounce системы в одну строчку, с любыми операциями :)
 *
 * Телеграм: https://t.me/nics51
 *
 * Этот стор позволяет делать за вас всю работу в области дебаунсов, прочитайте функции которые идут от mobxDebouncer)
 */
exports.mobxDebouncer = new MobxDebouncer();
// ========================== MOBX SAI HANDLER ==============================
/**
 * Создаёт временную MobX-реакцию для обработки данных из MobxSaiInstance.
 *
 * Эта утилита предназначена для случаев, когда тебе нужно отреагировать на результат запроса (успешный или с ошибкой),
 * хранящийся в Mobx-подобной структуре с полями `data` и `error`, и автоматически очистить реакцию после одного срабатывания.
 *
 * 📌 Преимущества:
 * - Автоматическое управление жизненным циклом (авто-диспоуз).
 * - Типизированная обработка успешного и ошибочного ответа.
 * - Возможность передать кастомный type guard для уточнения типа `data`.
 *
 * @template T - Тип успешного значения `data`, например: `VirtualList<GetPostFeedResponse[]>`
 *
 * @param saiInctance - Обьект из функции mobxSaiFetch с полями `data` и `error` и тд...
 * @param onSuccess - Функция-обработчик, вызывается при наличии корректного `data`
 * @param onError - (необязательно) Функция-обработчик, вызывается при наличии `error`
 * @param guard - (необязательно) Type guard-функция для проверки типа `data`
 *
 * @returns disposer - Функция для ручного отключения реакции, если нужно
 */
function mobxSaiHandler(sai, onSuccess, onError, guard) {
    const disposer = (0, mobx_1.reaction)(() => [sai.data, sai.error], ([data, error]) => {
        if (error) {
            onError === null || onError === void 0 ? void 0 : onError(error);
            disposer();
            return;
        }
        if (data && (guard ? guard(data) : true)) {
            onSuccess(data);
            disposer();
            return;
        }
    });
    return disposer;
}
