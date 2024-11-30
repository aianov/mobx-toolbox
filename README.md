# Mobx-toolkit, mini-lib for easy in MobX using

# useMobxUpdate

`useMobxUpdate` can reduce your code by 2/3+ times, depending on the volume of your functionality

## Usage

```typescript
// SomeComponent.tsx
const { commentsList } = commentsStore // store from MobX
const updateComments = useMobxUpdate(commentsList)

return (
	<div>
		{commentsList.map(comment => (
			<button
				key={comment.id}
				onClick={() => {
					updateComments(
						comment.id, // id
						'likes', // path to update
						prev => prev + 1 // update callback [! DONT USER prev++ !]
					)
				}}
			>
				{comment.likes} // will update
			</button>
		))}
	</div>
)
```

## Usage #2

### You can export your updater and use it EVERYWHERE!

```typescript
export const updateComment = useMobxUpdate(commentsStore.commentsList)
```

# Code with useMobxUpdate vs Code without useMobxUpdate

## Code without useMobxUpdate:

```typescript
// SomeComponent.tsx
export const SomeComponents = ({ comment }) => {
	const [likes, setLikes] = useState(comment.likes)
	const [dislikes, setDislikes] = useState(comment.dislikes)
	const [replies, setReplies] = useState(comment.replies)

	return (
		<div>
			<span>{likes}</span>
			<span>{dislikes}</span>
			<span>{replies}</span>

			<AnotherComponent
				comment={comment}
				setLikes={setLikes}
				setDislikes={setDislikes}
				setReplies={setReplies}
			/>

			<button
				onClick={() => {
					setLikes(prev => prev + 1)
					setDislikes(prev => prev + 1)
					setReplies(prev => prev + 1)
				}}
			>
				Update states
			</button>
		</div>
	)
}
```

## Code with useMobxUpdate:

```typescript
// Updaters.ts
export const updateComment = useMobxUpdate(commentsStore.commentsList)

// SomeComponent.tsx
import { updateComment } from 'path-to-updater'

export const SomeComponents = observer(({ comment }) => {
	return (
		<div>
			<span>{comment.likes}</span>
			<span>{comment.dislikes}</span>
			<span>{comment.replies)}</span>

			<AnotherComponent comment={comment} /> // you don't need to provide useState, update EVERYWHERE!

			<button
				onClick={() => {
					updateComment(comment.id, "likes", prev => prev + 1)
					updateComment(comment.id, "dislikes", prev => prev + 1)
					updateComment(comment.id, "replies", prev => prev + 1)
				}}
			>
				Update states
			</button>
		</div>
	)
})
```

# Options

## `useMobxUpdate`

Function `useMobxUpdate` 2 params, needs to update values in current element of array from mobx store

### Params

| Param         | Type             | Description                     | Initial | Required |
| ------------- | ---------------- | ------------------------------- | ------- | -------- |
| `array`       | `Array`          | Array from mobx store           |         | `true`   |
| `annotations` | `AnnotationsMap` | makeAutoObservable second param | `{}`    | `false`  |

### Returns

| Param      | Type                                                                                | Description  |
| ---------- | ----------------------------------------------------------------------------------- | ------------ |
| `Function` | `(id: string or number, path: string, updater: (prev: any) => void or any) => void` | your updater |

# -----------------------------

# mobxState (like useState)

## Usage

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

# Without mobxState VS With mobxState

## Code without mobxState:

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

## Code with mobxState

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

Function `mobxState` 3 params, need to create getter and setter logic

### Params

| Param           | Type                    | Description                                         | Initial | Required |
| --------------- | ----------------------- | --------------------------------------------------- | ------- | -------- |
| `initialValue`  | `generical`             | Object with keys for inputs                         |         | `true`   |
| `annotations`   | `AnnotationsMap`        | makeAutoObservable second param                     | `{}`    | `false`  |
| `options`       | `MakeObservableOptions` | makeAutoObservable third param                      | `{}`    | `false`  |
| `@returns_name` | `string`                | Name of state, to create set and get with your name |         | `true`   |

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

| Param              | Type                        | Description                 | Required |
| ------------------ | --------------------------- | --------------------------- | -------- |
| `initialValues`    | `Object`                    | Object with keys for inputs | `true`   |
| `validationSchema` | `any`                       | Your created schema         | `true`   |
| `options`          | `Partial<FormStateOptions>` | Options to form             | `false`  |

### options: Partial<FormStateOptions>:

`instaValidate` - Instantly validates form onChange input | initial `true`
`inputResetErr` - Reset errors onChange input | initial `true`
`validateAllOnChange` - Validating all inputs in form onChange | initial `false`
`resetErrIfNoValue` - Reset err in current field if input have empty string | initial `true`
`disabled` - Disable state | initial `false`
`observableAnnotations` - Annotations for makeAutoObservable | initial `{}`
`observableOptions` - Options for makeAutoObservable | initial `{}`

### Returns

| Param           | Type                            | Description                                         | Initial         |
| --------------- | ------------------------------- | --------------------------------------------------- | --------------- |
| `values`        | `Object`                        | Your current values                                 |                 |
| `errors`        | `Object`                        | Your errors here, with key+'Err'                    |                 |
| `initialValues` | `Object`                        | Your passed initial values DOESN'T CHANGE           |                 |
| `disabled`      | `boolean`                       | Disable state for inputs or something else          | initial `false` |
| `options`       | `Partial<FormStateOptions>`     | Your passed form options                            |                 |
| `reset`         | `'all' or 'values' or 'errors'` | Resets what u need                                  | initial `all`   |
| `setError`      | `(key, value) => void`          | Set your errors                                     |                 |
| `setValue`      | `(key, value) => void`          | Set your values                                     |                 |
| `validate`      | `() => boolean`                 | Validate you values and returns `true` if no errors |                 |

# -----------------------------

# Schemas for useMobxForm

## Usage

```typescript
// CREATING SCHEME
export const orderFormSchema = m.schema({
	name: m
		.reset()
		.required({ message: 'This is required' })
		.string({ message: 'Strings' })
		.minLength(3, { message: '3 min bro' })
		.maxLength(6, { message: '6 max bro' })
		.build(),
	description: m
		.reset()
		.required({ message: 'Bro?...' })
		.string({ message: 'Strings' })
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

// extend also have second param, override with initial state false, if override is false your validations in same keys will be connected to one, if override is true, then only validations from the new key will be setted
export const newScheme = someScheme.extend(
	{
		// validations
	},
	true
)
```

# REPO

https://github.com/aianov/mobx-toolkit
