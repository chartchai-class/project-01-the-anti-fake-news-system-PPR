<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch} from 'vue'
import type { Post } from '../types'

interface User {
  id: number
  name: string
}

const posts = ref<Post[]>([])
const users = ref<User[]>([])
const showMenu = ref(false)
const filter = ref('All')
const categories = ref<string[]>([])
const includeCats = ref<string[]>([])
const excludeCats = ref<string[]>([])
const includeInput = ref('')
const excludeInput = ref('')

const postsPerPage = ref(5)
const currentPage = ref(1)

watch([filter, includeCats, excludeCats], () => {
  currentPage.value = 1
}, { deep: true })

const filteredPosts = computed(() => {
  let result = posts.value
  if (filter.value === 'Real') result = result.filter((p) => p.rating[0] > p.rating[1])
  if (filter.value === 'Fake') result = result.filter((p) => p.rating[0] < p.rating[1])
  if (filter.value === 'Undetermine') result = result.filter((p) => p.rating[0] === p.rating[1])
  if (includeCats.value.length > 0) {
    result = result.filter((p) => includeCats.value.every((cat) => p.category.includes(cat)))
  }
  if (excludeCats.value.length > 0) {
    result = result.filter((p) => !excludeCats.value.some((cat) => p.category.includes(cat)))
  }
  return result
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage.value
  const end = start + postsPerPage.value
  return filteredPosts.value.slice(start, end)
})

function getUserName(userId: number) {
  const user = users.value.find((u) => u.id === userId)
  return user ? user.name : 'Unknown User'
}

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function addIncludeCat() {
  if (includeInput.value && categories.value.includes(includeInput.value) && !includeCats.value.includes(includeInput.value)) {
    includeCats.value.push(includeInput.value)
    includeInput.value = ''
    currentPage.value = 1 
  }
}
function removeIncludeCat(cat: string) {
  includeCats.value = includeCats.value.filter((c) => c !== cat)
  currentPage.value = 1 
}
function addExcludeCat() {
  if (excludeInput.value && categories.value.includes(excludeInput.value) && !excludeCats.value.includes(excludeInput.value)) {
    excludeCats.value.push(excludeInput.value)
    excludeInput.value = ''
    currentPage.value = 1 
  }
}
function removeExcludeCat(cat: string) {
  excludeCats.value = excludeCats.value.filter((c) => c !== cat)
  currentPage.value = 1
}
function resetFilters() {
  filter.value = 'All'
  includeCats.value = []
  excludeCats.value = []
  includeInput.value = ''
  excludeInput.value = ''
  postsPerPage.value = 5
  currentPage.value = 1 
}
function goToPage(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const carouselIndex = reactive<Record<number, number>>({})
function setCarousel(postId: number, idx: number) {
  carouselIndex[postId] = idx
}

onMounted(async () => {
  const res = await fetch('/db.json')
  const data = await res.json()
  posts.value = data.posts
  users.value = data.users
  categories.value = data.categories.map((cat: { name: string }) => cat.name)
  posts.value.forEach(post => {
    carouselIndex[post.id] = 0
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-2xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-blue-700">News Billboard</h1>
        <button
          @click="toggleMenu"
          class="p-2 rounded-full hover:bg-gray-200 focus:outline-none cursor-pointer"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <div v-if="showMenu" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-transparent" @click="showMenu = false"></div>
          <div class="relative bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-10">
            <div class="text-blue-700 font-bold text-2xl mb-3 border-b-2 border-gray-300 pb-2">
              Filter
            </div>
            <div class="text-gray-500 text-xl mb-1">Validation</div>
            <select
              v-model="filter" @change="currentPage = 1"
              class="w-full p-2 border-2 rounded-lg text-gray-500 text-m mb-2"
            >
              <option value="All">All</option>
              <option value="Real">Real</option>
              <option value="Fake">Fake</option>
              <option value="Undetermine">Undetermine</option>
            </select>
            <div class="mt-2">
              <div class="text-gray-700 text-m mb-1">Category (include)</div>
              <div class="flex gap-2 mb-2">
                <input
                  v-model="includeInput"
                  @keydown.enter.prevent="addIncludeCat"
                  list="include-cats"
                  class="flex-1 p-2 border rounded-lg text-m"
                  placeholder="Type to add..."
                />
                <datalist id="include-cats">
                  <option v-for="cat in categories" :key="cat" :value="cat" />
                </datalist>
                <button @click="addIncludeCat" class="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Add</button>
              </div>
              <div class="flex flex-wrap gap-2 mb-2">
                <span v-for="cat in includeCats" :key="cat" @click="removeIncludeCat(cat)" class="cursor-pointer px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center">
                  {{ cat }}
                  <button @click="removeIncludeCat(cat)" class="cursor-pointer ml-1 text-red-500 hover:text-red-700">&times;</button>
                </span>
              </div>
              <div class="text-gray-700 text-m mb-1">Category (exclude)</div>
              <div class="flex gap-2 mb-2">
                <input
                  v-model="excludeInput"
                  @keydown.enter.prevent="addExcludeCat"
                  list="exclude-cats"
                  class="flex-1 p-2 border rounded-lg text-m"
                  placeholder="Type to add..."
                />
                <datalist id="exclude-cats">
                  <option v-for="cat in categories" :key="cat" :value="cat" />
                </datalist>
                <button @click="addExcludeCat" class="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Add</button>
              </div>
              <div class="flex flex-wrap gap-2 mb-2">
                <span v-for="cat in excludeCats" :key="cat" @click="removeExcludeCat(cat)" class="cursor-pointer px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs flex items-center">
                  {{ cat }}
                  <button @click="removeExcludeCat(cat)" class="cursor-pointer ml-1 text-red-500 hover:text-red-700">&times;</button>
                </span>
              </div>
              <div class="text-gray-700 text-m mb-1">Post per page</div>
              <div class="flex gap-2 mb-4">
                <input
                  type="number"
                  min="1"
                  v-model.number="postsPerPage"
                  class="flex-1 p-2 border rounded-lg text-m"
                  placeholder="Posts per page"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-2">
              <button
                @click="resetFilters"
                class="px-4 py-2 rounded bg-red-200 text-red-500 hover:bg-red-300"
              >
                Reset
              </button>
              <button
                @click="showMenu = false"
                class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="space-y-6">
        <div
          v-for="post in paginatedPosts"
          :key="post.id"
          :class="[
            'cursor-pointer rounded-lg shadow p-6 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-2',
            post.rating[0] > post.rating[1]
              ? 'bg-green-50 border border-green-400 hover:border-green-600'
              : post.rating[0] < post.rating[1]
                ? 'bg-red-50 border border-red-400 hover:border-red-600'
                : 'bg-white border border-gray-200 hover:border-gray-400',
          ]"
          @click="$router.push({ name: 'PostDetails', params: { id: post.id } })"
        >
          <div class="flex items-center mb-1">
            <img
              :src="post.profile"
              alt="Post image"
              class="w-16 h-16 object-cover rounded-full mr-4 border"
            />
            <div class="flex flex-col leading-tight">
              <h5 class="text-xl font-medium mb-0">{{ getUserName(post.user) }}</h5>
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
                @click.stop="setCarousel(post.id, (carouselIndex[post.id] - 1 + post.contentImage.length) % post.contentImage.length)"
                class="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow hover:bg-blue-100"
                style="z-index:2"
                v-if="post.contentImage.length > 1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                @click.stop="setCarousel(post.id, (carouselIndex[post.id] + 1) % post.contentImage.length)"
                class="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow hover:bg-blue-100"
                style="z-index:2"
                v-if="post.contentImage.length > 1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
              <div
                v-for="(img, idx) in post.contentImage"
                :key="img"
                v-show="carouselIndex[post.id] === idx"
                class="w-full flex justify-center"
              >
                <img :src="img" alt="Content image" class="max-h-64 rounded-lg object-cover" />
              </div>
              <div class="flex justify-center gap-2 mt-2">
                <button
                  v-for="(img, idx) in post.contentImage"
                  :key="'dot-' + img"
                  @click="setCarousel(post.id, idx)"
                  :class="['w-3 h-3 rounded-full', carouselIndex[post.id] === idx ? 'bg-blue-500' : 'bg-gray-300']"
                ></button>
              </div>
            </div>
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
        <div v-if="filteredPosts.length > postsPerPage" class="flex justify-center mt-6 gap-2">
          <button
            v-for="page in Math.ceil(filteredPosts.length / postsPerPage)"
            :key="page"
            @click="goToPage(page)"
            :class="['px-3 py-1 rounded cursor-pointer', currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>