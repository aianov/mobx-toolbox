import { IEqualsComparer } from 'mobx'
import { Annotation, AnnotationsMap } from 'mobx/dist/internal'

// ========================== MOBX STATE ==============================

export type CreateObservableOptions = { name?: string; equals?: IEqualsComparer<any>; deep?: boolean; defaultDecorator?: Annotation; proxy?: boolean; autoBind?: boolean }
export interface MobxState { [key: string]: any }
export type SetterType<K extends string, T> = { [SetterName in `set${Capitalize<K>}`]: (newValue: T | ((prev: T) => T)) => void }
export type MobxStateWithGetterAndSetter<T, K extends string> = MobxState & { [Value in K]: T } & SetterType<K, T>
export type MakeObservableOptions = Omit<CreateObservableOptions, 'proxy'>

// ========================== USE VALIDATION ==============================

export type Validator = (value: any) => boolean | string
export type FormValues<T> = { [K in keyof T]: T[K] }
export type FormErrors<T> = { [K in keyof T]: string } & { [K in keyof T as `${K & string}Err`]: string }
export interface SchemaOptions { message?: string }
export interface FormStateOptions {
	instaValidate?: boolean
	inputResetErr?: boolean
	validateAllOnChange?: boolean
	resetErrIfNoValue?: boolean
	disabled?: boolean
	observableAnnotations?: AnnotationsMap<MobxState, never>
	observableOptions?: MakeObservableOptions
}
export type ValidationResult = {
	success: boolean
	errors: Record<string, string>
}