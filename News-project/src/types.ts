export interface Post {
  id: number
  user: number
  profile: string
  contentImage: string[]
  category: string[]
  title: string
  content: string
  date: string
  rating: number[]
  comments: Comment[]
}

export interface User {
  id: number
  name: string
}

export interface Category {
  name: string
  posts: Post[]
}

export interface Comment {
  id: number
  userId: number
  content: string
  date: string
  rating: number
}
