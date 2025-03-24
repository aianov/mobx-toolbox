# Mobx-toolkit, mini-lib for easy in MobX using

# mobxDebouncer

`mobxDebouncer` can help with any difficulty of debounce system by using 1 line of code :)

## Usage

```typescript
// some-store.ts
class TestStore {
	constructor() {
		makeAutoObservable(this)
	}

	postUpdater: null | MobxUpdateInstance<Post> = null
	setPostUpdater = (updater: MobxUpdateInstance<Post>) =>
		(this.postUpdater = updater)

	toggleLikePost = (postId: number, post: GetPostFeedResponse) => {
		if (!this.postUpdater) return

		runInAction(() => {
			this.postUpdater(
				postId,
				'likesCount',
				(prev: number) => prev + (post?.isLiked ? -1 : 1)
			)
			this.postUpdater(postId, 'isLiked', (prev: boolean) => !prev)
		})

		mobxDebouncer.debouncedAction(
			postId, // id of debounced action
			() => console.log('CALLBACK'), // callback
			1000, // delay
			'like-fav' // group key
		)
	}

	toggleFavPost = (postId: number, post: GetPostFeedResponse) => {
		if (!this.postUpdater) return

		runInAction(() => {
			this.postUpdater(
				postId,
				'favoritesCount',
				(prev: number) => prev + (post?.isFavorited ? -1 : 1)
			)
			this.postUpdater(postId, 'isFavorited', (prev: boolean) => !prev)
		})

		mobxDebouncer.debouncedAction(
			postId,
			() => console.log('CALLBACK'),
			1000,
			'like-fav'
		)
	}
}

// then you can use it in your component like this:
// some-component.tsx
const { currentTheme } = themeStore
const { toggleLikePost, toggleFavPost } = postInteractionsStore

const toggleLikeHandler = () => toggleLikePost(post?.id, post)
const toggleFavHandler = () => toggleFavPost(post?.id, post)

return (
	<div>
		<button onClick={toggleLikeHandler}>
			{post?.isLiked ? 'Liked' : 'Like'}
			{post?.likesCount}
		</button>
		<button onClick={toggleFavHandler}>
			{post?.isFavorited ? 'Favorited' : 'Fav'}
			{post?.favoritesCount}
		</button>
	</div>
)
```

### Now we have 2 debounced actions, and they will be called only after 1 second of last call, and if we call them in 1 second, they will be called only once

### Cool right? Just 1 line of code and you have debounced action with group key, and you can use it in any component, in any place, with any action in group.

This is very useful for some cases, like when you need to debounce some actions, but you need to call them in one place, and you need to call them in any component, in any place, with any action in group.

mobxDebouncer can reduce your code by 2/3+ times, depending on the volume of your functionality

### mobxDebouncer also have `cancelAllDebouncedActions` `cancelDebouncedActionsByGroup` `cancelDebouncedActions` and `flushDebouncedActions` functions.

### `cancelAllDebouncedActions` - Cancel all debounced actions

### `cancelDebouncedActionsByGroup` - Cancel all debounced actions by group key

### `cancelDebouncedActions` - Cancel debounced action by id

### `flushDebouncedActions` - Flush all debounced actions

### But the main and most useful/important function is `debouncedAction` so i will explain options only for it

# Options

## `mobxDebouncer.debouncedAction`

Function `mobxDebouncer.debouncedAction` 4 params, needs do your life with debounce much easier

### Params

| Param      | Type         | Description                   | Initial | Required |
| ---------- | ------------ | ----------------------------- | ------- | -------- |
| `id`       | `string`     | Id of debounced action        |         | `true`   |
| `callback` | `() => void` | Callback to call              |         | `true`   |
| `delay`    | `number`     | Delay of debounce             | `1000`  | `false`  |
| `groupKey` | `string`     | Group key of debounced action | `null`  | `false`  |

# mobxSaiFetch

`mobxSaiFetch` can reduce your actions in mobx, and make life easier :)

## Usage

```typescript
// some-store.ts
class TestStore {
	constructor() {
		makeAutoObservable(this)
	}

	saiData: MobxSaiInstance<TestFetchData> = {}
	saiDataPage = mobxState(1)('saiDataPage')
	isFetchUp = mobxState(false)('isFetchUp')

	getSaiMessageAction = async () => {
		const { messagePage, messageLimit } = messageApiStore
		const { selectedChat } = chatStore

		try {
			this.saiData = mobxSaiFetch(
				getMessage({ page: messagePage, limit: messageLimit })
			)
		} catch (err) {
			console.log(err)
		}
	}
}

export const testStore = new TestStore()

// SomeComponent.tsx
const {
	saiData: {
		data,
		status, // or isPending
	},
} = testStore

return (
	<div>
		{status == 'pending' ? (
			<Loading />
		) : (
			data?.message?.map(msg => <Messages msg={msg} />)
		)}
	</div>
)
```

### That was interesting right? Now i con show you more interesting things in mobxSaiFetch:

## Usage #2 [Pro]

```typescript
// some-store.ts
class TestStore {
	constructor() {
		makeAutoObservable(this)
	}

	saiData: MobxSaiInstance<TestFetchData> = {}
	saiDataPage = mobxState(1)('saiDataPage')
	isFetchUp = mobxState(false)('isFetchUp')

	getSaiMessageAction = async () => {
		const { messagePage, messageLimit } = messageApiStore
		const { selectedChat } = chatStore

		try {
			this.saiData = mobxSaiFetch(
				getMessage.bind(null, { page: messagePage, limit: messageLimit }), // you need to write bind or () => getMessage() if you want to provide settings
				{
					id: selectedChatId, // u need to provide special id, not index from arr method or smthng
					page: this.saiData, // for pagination
					pageSetterName: 'saiDataPage', // also for pagination
					isFetchUp: this.isFetchUp.isFetchUp, // and also for pagination (fetch up or down), if down then +1 from page, otherwise -1
					fetchType: 'pagination', // without "pagination", your page, setterName and isFetchUp are useless | Initial: "default"
					fetchIfPending: false, // If true, it will be fetch without any coldowns | Initial: false
					fetchIfHaveData: true, // If false, it wont do fetch if you have a response from last request | Initial: true
				}
			)
		} catch (err) {
			console.log(err)
		}
	}
}

export const testStore = new TestStore()

// SomeComponent.tsx
const {
	saiData: {
		data,
		status, // or isPending
	},
} = testStore

return (
	<div>
		{status == 'pending' ? (
			<Loading />
		) : (
			data?.message?.map(msg => <Messages msg={msg} />)
		)}
	</div>
)
```

## Usage #3 [Pro] Data scope in scroll

```typescript
// some-store.ts
class TestStore {
	constructor() {
		makeAutoObservable(this)
	}

	selectedMessage = {}

	saiData: MobxSaiInstance<TestFetchData> = {}
	saiDataPage = mobxState(1)('saiDataPage')
	isFetchUp = mobxState(false)('isFetchUp')
	messagesCache = mobxState([])('messagesCache')
	saiDataLimit = 40

	getSaiMessageAction = async () => {
		try {
			const params = mobxState<GetChatProfileMediaParams>({
				limit: this.saiDataLimit,
				up: this.isFetchUp,
			})('params')

			this.chatMediaProfile = mobxSaiFetch(
				() => getChatProfileMedia(selectedMessage.id, params.params),
				{
					id: selectedMessage.id,
					fetchIfHaveData: false,
					cacheSystem: {
						limit: this.saiDataLimit,
						setCache: this.setMessagesCache,
					},
					dataScope: {
						class: 'our-scroller',
						startFrom: 'top',
						topPercentage: 20,
						botPercentage: 80,
						relativeParamsKey: 'relativeMessageId',
						upOrDownParamsKey: 'up',
						isHaveMoreResKey: 'isHaveMoreBotOrTop',
						setParams: params.setParams,
					},
					fetchAddTo: {
						path: 'data',
						addTo: 'start',
					},
				}
			)
		} catch (err) {
			console.log(err)
		}
	}
}

// SomeComponent.tsx
const {
	saiData: {
		data,
		status, // or isPending
	},
} = testStore

return (
	<div className='our-scroller'>
		{status == 'pending' ? (
			<Loading />
		) : (
			data?.message?.map(msg => <Messages msg={msg} />)
		)}
	</div>
)
```

Its very hard to use because, but this code can do logic with data scope. Like messages in telegram or media files in scroll scope.
This options can reduce 200 strokes of code

# Options

## `mobxSaiFetch`

Function `mobxSaiFetch` 2 params, needs do your life with requests much easier

### Params

| Param      | Type                  | Description                  | Initial | Required |
| ---------- | --------------------- | ---------------------------- | ------- | -------- |
| `function` | `() => Promise<ay>`   | Function to request          |         | `true`   |
| `options`  | `MobxSaiFetchOptions` | Options to your mobxSaiFetch | `{}`    | `false`  |

### Returns

| Param               | Type                                   | Description                                                       |
| ------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| `data`              | `unknown`                              | your data from fetch                                              |
| `status`            | `"pending" / "fulfillef" / "rejected"` | Your fetch status                                                 |
| `error`             | `string`                               | Just error message                                                |
| `isFetched`         | `boolean`                              | Can give you information about if mobxSaiFetch is already fetched |
| `isPenging`         | `boolean`                              |                                                                   |
| `isFulfulled`       | `boolean`                              |                                                                   |
| `isRejected`        | `boolean`                              |                                                                   |
| `addedToEndCount`   | `number`                               | How much times we added new data to the end of our data array     |
| `addedToStartCount` | `number`                               | How much times we added new data to the start of our data array   |
| `fetchedCount`      | `number`                               | How much times we fetched with mobxSaiFetch                       |
| `scrollProgress`    | `number`                               | Our scroll progress (if we passed class in dataScope option)      |
| `gettedToTop`       | `MobxState`                            | How much we getted to top                                         |
| `botStatus`         | `"pending" / "fulfillef" / "rejected"` | Fetch to the bottom status                                        |
| `topState`          | `"pending" / "fulfillef" / "rejected"` | Fetch to the top status                                           |
| `scrollCachedData`  | `MobxState`                            | Our cached data if we passed cacheSystem and dataScope options    |
| `isBotPending`      | `boolean`                              |                                                                   |
| `isBotRejected`     | `boolean`                              |                                                                   |
| `isBotFulfilled`    | `boolean`                              |                                                                   |
| `isTopPending`      | `boolean`                              |                                                                   |
| `isTopRejected`     | `boolean`                              |                                                                   |
| `isTopFulfilled`    | `boolean`                              |                                                                   |
| `topError`          | `string`                               | Fetch to top error                                                |
| `botError`          | `string`                               | Fetch to bot error                                                |
| `isHaveMoreBot`     | `MobxState`                            | Have we more data to the bottom?                                  |
| `isHaveMoreTot`     | `MobxState`                            | Have we more data to the top?                                     |

# -----------------------------

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

## You can also use mobxState without "clear" functions

### Just use { reset: true } option, you state will be clear only if your state unobserved

```typescript
count = mobxState(0)('count', { reset: true })
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

| Param           | Type                    | Description                                                                     | Initial | Required |
| --------------- | ----------------------- | ------------------------------------------------------------------------------- | ------- | -------- |
| `initialValue`  | `generical`             | Object with keys for inputs                                                     |         | `true`   |
| `annotations`   | `AnnotationsMap`        | makeAutoObservable second param                                                 | `{}`    | `false`  |
| `options`       | `MakeObservableOptions` | makeAutoObservable third param                                                  | `{}`    | `false`  |
| `@returns_name` | `string`                | Name of state, to create set and get with your name                             |         | `true`   |
| `@options`      | `MobxStateOptions`      | You can set { reset: true } to reset your value on onmount (only if you state ) | `{}`    | `false`  |

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
