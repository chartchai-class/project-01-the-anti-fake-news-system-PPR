<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Post, User } from '../types'

const route = useRoute()
const router = useRouter()
const post = ref<Post | null>(null)
const userName = ref('Unknown User')
const carouselIndex = reactive({ idx: 0 })
const users = ref<User[]>([])

const commentsPage = ref(1)
const commentsPerPage = 5

const newCommentText = ref('')
const newCommentImage = ref('')
const newCommentVote = ref('')
const showAddComment = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localComments = ref<any[]>([])

function getLocalCommentsKey(postId: number) {
  return `post_comments_${postId}`
}

function loadLocalComments(postId: number) {
  const key = getLocalCommentsKey(postId)
  const stored = localStorage.getItem(key)
  localComments.value = stored ? JSON.parse(stored) : []
}

function saveLocalComments(postId: number) {
  const key = getLocalCommentsKey(postId)
  localStorage.setItem(key, JSON.stringify(localComments.value))
}

function addComment() {
  if (!post.value) return
  if (!newCommentVote.value || (!newCommentText.value && !newCommentImage.value)) return
  const voteMap = { real: 1, fake: 0, novote: -1 }
  const key = newCommentVote.value as keyof typeof voteMap

  const comment = {
    id: Date.now(),
    userId: 0,
    content: newCommentText.value,
    date: new Date().toISOString().slice(0, 10),
    rating: voteMap[key],
    image: newCommentImage.value,
    profile: 'https://randomuser.me/api/portraits/men/' + Math.floor(Math.random() * 99) + '.jpg',
    name: 'Admin',
  }
  localComments.value.unshift(comment)
  saveLocalComments(post.value.id)
  newCommentText.value = ''
  newCommentImage.value = ''
  newCommentVote.value = ''
  showAddComment.value = false
}

const allComments = computed(() => {
  if (!post.value) return []
  // Merge local comments and post comments
  return [...localComments.value, ...(post.value.comments || [])]
})

const paginatedComments = computed(() => {
  const start = (commentsPage.value - 1) * commentsPerPage
  return allComments.value.slice(start, start + commentsPerPage)
})
const totalCommentsPages = computed(() => {
  return Math.ceil(allComments.value.length / commentsPerPage) || 1
})

function getUserInfo(userId: number) {
  const user = users.value.find((u) => u.id === userId)
  return user || { id: 0, name: 'Unknown User' }
}

function getUserProfile(userId: number) {
  const userPost = postList.value.find((p) => p.user === userId)
  return userPost ? userPost.profile : 'https://randomuser.me/api/portraits/lego/1.jpg'
}

const postList = ref<Post[]>([])

onMounted(async () => {
  const res = await fetch('/db.json')
  const data = await res.json()
  postList.value = data.posts
  users.value = data.users
  const postId = Number(route.params.id)
  post.value = data.posts.find((p: Post) => p.id === postId)
  if (post.value) {
    const user = data.users.find((u: { id: number; name: string }) => u.id === post.value!.user)
    userName.value = user ? user.name : 'Unknown User'
    carouselIndex.idx = 0
    loadLocalComments(post.value.id)
  }
})
</script>

<template>
  <div v-if="post" class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-2xl mx-auto">
      <button
        @click="router.back()"
        class="mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
      >
        Back
      </button>
      <div
        :class="[
          'rounded-lg shadow p-6 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-2',
          post.rating[0] > post.rating[1]
            ? 'bg-green-50 border border-green-400 hover:border-green-600'
            : post.rating[0] < post.rating[1]
              ? 'bg-red-50 border border-red-400 hover:border-red-600'
              : 'bg-white border border-gray-200 hover:border-gray-400',
        ]"
      >
        <div class="flex items-center mb-1">
          <img
            :src="post.profile"
            alt="Post image"
            class="w-16 h-16 object-cover rounded-full mr-4 border"
          />
          <div class="flex flex-col leading-tight">
            <h5 class="text-xl font-medium mb-0">{{ userName }}</h5>
            <div class="text-m text-gray-400 mt-0">ID: {{ post.user }}</div>
          </div>
        </div>
        <div class="text-2xl font-bold mb-1">{{ post.title }}</div>
        <div class="text-m text-gray-500">{{ post.date }}</div>
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="cat in post.category"
            :key="cat"
            class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
            >#{{ cat }}</span
          >
        </div>
        <div v-if="post.contentImage && post.contentImage.length" class="my-2">
          <div class="relative w-full overflow-hidden">
            <button
              @click="
                carouselIndex.idx =
                  (carouselIndex.idx - 1 + post.contentImage.length) % post.contentImage.length
              "
              class="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-blue-100"
              style="z-index: 2"
              v-if="post.contentImage.length > 1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              @click="carouselIndex.idx = (carouselIndex.idx + 1) % post.contentImage.length"
              class="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-blue-100"
              style="z-index: 2"
              v-if="post.contentImage.length > 1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div
              v-for="(img, idx) in post.contentImage"
              :key="img"
              v-show="carouselIndex.idx === idx"
              class="w-full flex justify-center"
            >
              <img :src="img" alt="Content image" class="max-h-64 rounded-lg object-cover" />
            </div>
            <div class="flex justify-center gap-2 mt-2">
              <button
                v-for="(img, idx) in post.contentImage"
                :key="'dot-' + img"
                @click="carouselIndex.idx = idx"
                :class="[
                  'w-3 h-3 rounded-full',
                  carouselIndex.idx === idx ? 'bg-blue-500' : 'bg-gray-300',
                ]"
              ></button>
            </div>
          </div>
        </div>
        <div class="mt-4 mb-4 text-lg text-gray-700 font-semibold">
          {{ post.content }}
        </div>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1 text-green-600 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 inline"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2"
                fill="#d1fae5"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            {{ post.rating[0] }} Real
          </span>
          <span class="flex items-center gap-1 text-red-600 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 inline"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2"
                fill="#fee2e2"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 9l-6 6m0-6l6 6"
              />
            </svg>
            {{ post.rating[1] }} Fake
          </span>
        </div>
      </div>
      <div v-if="allComments.length" class="mt-8">
        <div class="text-xl font-bold text-blue-700 mb-2">Comments</div>
        <div class="mb-4">
          <button
            @click="showAddComment = !showAddComment"
            class="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-600"
          >
            Add Comment / Vote
          </button>
          <div v-if="showAddComment" class="mt-4 p-4 bg-white rounded-lg shadow border">
            <div class="mb-2">
              <label class="block font-semibold mb-1">Vote on this news:</label>
              <select v-model="newCommentVote" class="w-full p-2 border rounded">
                <option value="" disabled>Select your vote</option>
                <option value="real">Real</option>
                <option value="fake">Fake</option>
                <option value="novote">No Vote</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="block font-semibold mb-1">Comment:</label>
              <textarea
                v-model="newCommentText"
                rows="2"
                class="w-full p-2 border rounded"
                placeholder="Add your comment..."
              ></textarea>
            </div>
            <div class="mb-2">
              <label class="block font-semibold mb-1">Image URL (optional):</label>
              <input
                v-model="newCommentImage"
                type="url"
                class="w-full p-2 border rounded"
                placeholder="Paste image URL to support your vote"
              />
            </div>
            <div class="flex gap-2 mt-2">
              <button
                @click="addComment"
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit
              </button>
              <button
                @click="showAddComment = false"
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div
            v-for="comment in paginatedComments"
            :key="comment.id"
            :class="[
              'rounded-lg shadow p-4 border transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-2',
              comment.rating === 1
                ? 'bg-green-50 border-green-400 hover:border-green-600'
                : comment.rating === 0
                  ? 'bg-red-50 border-red-400 hover:border-red-600'
                  : 'bg-white border-gray-200 hover:border-gray-400',
            ]"
          >
            <div class="flex items-center mb-1">
              <img
                :src="comment.profile ? comment.profile : getUserProfile(comment.userId)"
                alt="User profile"
                class="w-12 h-12 object-cover rounded-full border mr-2"
              />
              <div class="flex flex-col leading-tight">
                <h5 class="font-medium text-lg">
                  {{ comment.name ? comment.name : getUserInfo(comment.userId).name }}
                </h5>
                <div class="text-xs text-gray-400">ID: {{ comment.userId }}</div>
              </div>
            </div>
            <div class="text-gray-700 mb-1 font-semibold">{{ comment.content }}</div>
            <div v-if="comment.image" class="mb-1">
              <img
                :src="comment.image"
                alt="Comment image"
                class="max-h-32 rounded border mx-auto"
              />
              <div class="text-xs text-gray-500 text-center">Image evidence</div>
            </div>
            <div class="text-xs text-gray-500">{{ comment.date }}</div>
            <div v-if="comment.rating !== -1" class="mt-1 flex items-center gap-2">
              <span
                v-if="comment.rating === 1"
                class="flex items-center gap-1 text-green-600 font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="#d1fae5"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4"
                  />
                </svg>
                Real
              </span>
              <span
                v-else-if="comment.rating === 0"
                class="flex items-center gap-1 text-red-600 font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="#fee2e2"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 9l-6 6m0-6l6 6"
                  />
                </svg>
                Fake
              </span>
            </div>
          </div>
        </div>
        <div v-if="allComments.length > commentsPerPage" class="flex justify-center mt-6 gap-2">
          <button
            v-for="page in totalCommentsPages"
            :key="page"
            @click="commentsPage = page"
            :class="[
              'px-3 py-1 rounded cursor-pointer',
              commentsPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
            ]"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
