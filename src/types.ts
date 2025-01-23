import { IEqualsComparer } from 'mobx'
import { Annotation, AnnotationsMap } from 'mobx/dist/internal'

// ========================== MOBX STATE ==============================

export type MobxStateWithGetterAndSetter<K extends string, T> = { [Value in K]: T } & SetterType<K, T>
export type SetterType<K extends string, T> = { [SetterName in `set${Capitalize<K>}`]: (newValue: T | ((prev: T) => T)) => void }
export interface MobxStateOptions { reset?: boolean }
export type MakeObservableOptions = Omit<CreateObservableOptions, 'proxy'>
export type CreateObservableOptions = { name?: string; equals?: IEqualsComparer<any>; deep?: boolean; defaultDecorator?: Annotation; proxy?: boolean; autoBind?: boolean }

// ========================== USE VALIDATION ==============================

export type Validator = (value: any) => boolean | string
export type FormValues<T> = { [K in keyof T]: T[K] }
export type FormErrors<T> = { [K in keyof T]: string } & { [K in keyof T as `${K & string}Err`]: string }
export interface SchemaOptions { message?: string }
export type ValidationResult = { success: boolean; errors: Record<string, string> }
export interface FormStateOptions {
	instaValidate?: boolean
	inputResetErr?: boolean
	validateAllOnChange?: boolean
	resetErrIfNoValue?: boolean
	disabled?: boolean
	observableAnnotations?: AnnotationsMap<{ [key: string]: any }, never>
	observableOptions?: MakeObservableOptions
}

// ========================== USE MOBX UPDATER ==============================

export type Identifiable = { id: string | number }
type PrevDepth<D extends number> = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10][D]
export type AnyNestedKeyOf<T, Depth extends number = 5> = NestedKeyOf<T, Depth> | string
export type NestedKeyOf<T, Depth extends number = 5> = [Depth] extends [never]
	? never
	: T extends object
	? {
		[K in keyof T]: K extends string | number
		? T[K] extends (infer U)[]
		? `${K}` | `${K}[${number}]` | `${K}[${number}].${NestedKeyOf<U, PrevDepth<Depth>>}`
		: `${K}` | `${K}.${NestedKeyOf<T[K], PrevDepth<Depth>>}`
		: never
	}[keyof T]
	: never

export type GetTypeFromKey<T, K extends AnyNestedKeyOf<T>> =
	K extends `${infer Key}.${infer Rest}`
	? Key extends keyof T
	? Rest extends NestedKeyOf<T[Key]>
	? GetTypeFromKey<T[Key], Rest>
	: T[Key]
	: any
	: K extends `${infer Key}[${infer _Index}].${infer Rest}`
	? Key extends keyof T
	? T[Key] extends (infer U)[]
	? Rest extends NestedKeyOf<U>
	? GetTypeFromKey<U, Rest>
	: U
	: any
	: any
	: K extends `${infer Key}[${infer _Index}]`
	? Key extends keyof T
	? T[Key] extends (infer U)[]
	? U
	: any
	: any
	: K extends keyof T
	? T[K]
	: any

export type UpdaterT<T, K extends AnyNestedKeyOf<T>> =
	| ((prevValue: GetTypeFromKey<T, K>) => GetTypeFromKey<T, K>)
	| GetTypeFromKey<T, K>
