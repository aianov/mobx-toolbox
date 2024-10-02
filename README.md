# Mobx-toolkit, mini-lib for easy in MobX using

# mobxState (like useState)

## Instructions

```typescript
// counter-store.ts
class Counter {
	constructor() {
		makeAutoObservable(this)
	}

	count = mobxState(1)('count')
}

const counterStore = new Counter()

// App.tsx
export const App = () => {
	const {
		count: { count, setCount },
	} = counterStore

	return <div onClick={setCount(count + 1)}>{count}</div>
}
```

## You can also use setCount like useState, for example:

```typescript
setCount(prev => prev + 1)
setCount(prev => {
	return prev ** 2
})
```

## Type whatever you want

```typescript
class Counter {
	constructor() {
		makeAutoObservable(this)
	}

	count = mobxState<SomeType | number>(1)('count')
}
```

## You can use MobX annotations and options in makeAutoObservable, because our lib just creating another observable store

```typescript
class Counter {
	constructor() {
		makeAutoObservable(this)
	}

	count = mobxState(1, { count: observable.ref }, { deep: true })('count')
	// u need to write name 'count', sorry about that ;)
}
```

# Without mobx-state-lib VS with mobx-state-lib

## Code without mobx-state-lib:

```typescript
// posts-store.ts
class PostsStore {
  constructor() {makeAutoObservable(this)}

  count = 1
  addCount = () => this.count += 1

  posts: Post[] = []
  setPosts = (posts: Post[]) => this.posts = posts
}
export const postsStore = new PostsStore()

// App.tsx
const {
  setPosts,
  posts,
  count,
  addCount
} = postsStore

<div
  onClick={() => {
    setPosts(posts.filter(t => t.id !== postId))
    addCount()
  }}
>
  {count}
</div>
```

## Code with mobx-state-lib

```typescript
// posts-store.ts
class PostsStore {
  constructor() {makeAutoObservable(this)}

  count = mobxState(1)('count')
  posts = mobxState<Post[]>([])('posts')
}
export const postsStore = new PostsStore()

// App.tsx
const {
  posts: { setPosts },
  count: { setCount }
} = postsStore

<div
  onClick={() => {
    setPosts(prev => prev.filter(t => t.id !== postId))
    setCount(prev => prev + 1)
  }}
>
  {count}
</div>
```

# Options

## `mobxState`

Function `mobxState` 3 params, and 1 return param, need to create getter and setter logic

### Params

| Param           | Type                    | Description                                         | Initial | Required |
| --------------- | ----------------------- | --------------------------------------------------- | ------- | -------- |
| `initialValue`  | `generical`             | Object with keys for inputs                         |         | `true`   |
| `annotations`   | `AnnotationsMap`        | makeAutoObservable second param                     | `{}`    | `false`  |
| `options`       | `MakeObservableOptions` | makeAutoObservable third param                      | `{}`    | `false`  |
| `@returns_name` | `string`                | Name of state, to create set and get with your name |         | `true`   |

### annotations: AnnotationsMap<MobxState, never>:

`{ _@returns_name: observable. }` - Need to custom or not decarators to makeAutoObservable second param | initial `{}`
`options` - Need to pass options to makeAutoObservable third param, name, equals, deep, proxy, autoBind | initial `{}`

### Returns

| Param               | Type                                        | Description           |
| ------------------- | ------------------------------------------- | --------------------- |
| `(returns_name)`    | `Key`                                       | your value            |
| `set(returns_name)` | `() => newValue or (prevValue) => newValue` | your setter for value |

# -----------------------------

# useMobxForm (like RHF + Zod, but this is MobX)

## Create scheme

```typescript
// CREATING SCHEME
export const orderFormSchema = m.schema({
	name: m
		.reset()
		.required({ message: 'This is required' })
		.string({ message: 'стринги' })
		.minLength(3, { message: '3 min bro' })
		.maxLength(6, { message: '6 max bro' })
		.build(),
	description: m
		.reset()
		.required({ message: 'Bro?...' })
		.string({ message: 'стринги' })
		.minLength(4, { message: '4 min bro' })
		.maxLength(7, { message: '7 max bro' })
		.build(),
})
```

## Create form

```typescript
import orderFormSchema from './schema'

class FormStore {
	constructor() {
		makeAutoObservable(this)
	}

	orderForm = useMobxForm({ name: '', description: '' }, orderFormSchema)

	submitForm() {
		if (!this.orderForm.validate()) return
		alert('done')
		this.orderForm.reset()
	}
}
export const formStore = new FormStore()
```

## Use in component

```typescript
const {
	orderForm: {
		setValue,
		values: { name, description },
		errors: { nameErr, descriptionErr },
	},
} = formStore

return (
	<form onSubmit={handleSubmit}>
		<div>
			<label htmlFor='name'>Name:</label>
			<input
				type='text'
				name='name'
				value={name}
				onChange={e => {
					e.preventDefault()
					setValue(e.target.name, e.target.value)
				}}
			/>
			{nameErr && <span>{nameErr}</span>}
		</div>

		<div>
			<label htmlFor='description'>Description:</label>
			<input
				type='text'
				name='description'
				value={description}
				onChange={e => {
					e.preventDefault()
					setValue(e.target.name, e.target.value)
				}}
			/>
			{descriptionErr && <span>{descriptionErr}</span>}
		</div>

		<button type='submit'>Submit</button>
	</form>
)
```

# Options

## `useMobxForm`

Function `useMobxForm` 3 params, need to create a form, have many options

### Params

| Param              | Type                        | Description                 | Initial         | Required |
| ------------------ | --------------------------- | --------------------------- | --------------- | -------- |
| `initialValues`    | `Object`                    | Object with keys for inputs | initial `true`  | `true`   |
| `validationSchema` | `any`                       | Your created schema         | initial `true`  | `true`   |
| `options`          | `Partial<FormStateOptions>` | Options to form             | initial `false` | `false`  |

### options: Partial<FormStateOptions>:

`instaValidate` - Instantly validates form onChange input | initial `true`
`inputResetErr` - Reset errors onChange input | initial `true`
`validateAllOnChange` - Validating all inputs in form onChange | initial `false`
`resetErrIfNoValue` - Reset err in current field if input have empty string | initial `true`

### Returns

| Param           | Type                            | Description                                         | Initial       |
| --------------- | ------------------------------- | --------------------------------------------------- | ------------- |
| `values`        | `Object`                        | Your current values                                 |               |
| `errors`        | `Object`                        | Your errors here, with key+'Err'                    |               |
| `initialValues` | `Object`                        | Your passed initial values DOESN'T CHANGE           |               |
| `options`       | `Partial<FormStateOptions>`     | Your passed form options                            |               |
| `reset`         | `'all' or 'values' or 'errors'` | Resets what u need                                  | initial `all` |
| `setError`      | `(key, value) => void`          | Set your errors                                     |               |
| `setValue`      | `(key, value) => void`          | Set your values                                     |               |
| `validate`      | `() => boolean`                 | Validate you values and returns `true` if no errors |               |

# -----------------------------

# Schemas for useMobxForm

## Usage

```typescript
// CREATING SCHEME
export const orderFormSchema = m.schema({
	name: m
		.reset()
		.required({ message: 'This is required' })
		.string({ message: 'стринги' })
		.minLength(3, { message: '3 min bro' })
		.maxLength(6, { message: '6 max bro' })
		.build(),
	description: m
		.reset()
		.required({ message: 'Bro?...' })
		.string({ message: 'стринги' })
		.minLength(4, { message: '4 min bro' })
		.maxLength(7, { message: '7 max bro' })
		.build(),
})
```

.reset() required to be in the beginning, and .build() required to be at the end

## U can pick and extend validation keys from sheme

```typescript
// pick function, u need to pass keys as a string array
export const signScheme = emailScheme.pick(['email', 'password'])
```

```typescript
export const emailScheme = m.schema({
	email: m
		.reset()
		.required({ message: 'Please write mail' })
		.regex(emailRegex, { message: 'Write correct mail' })
		.build(),
})

// extend function, just like extends from classes :P
export const signScheme = emailScheme.extend({
	password: m
		.reset()
		.required({ message: 'Please write password' })
		.minLength(6, { message: 'Min length of password, 6 bytes' })
		.build(),
})
```

# REPO

https://github.com/aianov/mobx-toolkit
