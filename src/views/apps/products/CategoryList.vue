<script setup lang="ts">
interface Category {
  id: number
  name: string
  slug: string
  description?: string | null
  status: string
  created_at: string
}

const headers = [
  { title: 'NAME', key: 'name' },
  { title: 'SLUG', key: 'slug' },
  { title: 'STATUS', key: 'status' },
  { title: 'CREATED', key: 'created_at' },
  { title: 'ACTIONS', key: 'actions', sortable: false },
]

const searchQuery = ref('')
const selectedStatus = ref<'all' | string>('all')
const itemsPerPage = ref(20)
const page = ref(1)

const skip = computed(() => (page.value - 1) * itemsPerPage.value)
const limit = computed(() => itemsPerPage.value)

const { data: categoriesData, execute: fetchCategories } = await useApi<any>(createUrl('/categories/', {
  query: {
    skip,
    limit,
    status: computed(() => (selectedStatus.value === 'all' ? undefined : selectedStatus.value)),
  },
}))

const categories = computed((): Category[] => categoriesData.value?.data ?? [])
const totalCategories = computed(() => categoriesData.value?.total ?? 0)

const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query)
    return categories.value

  return categories.value.filter(category =>
    category.name.toLowerCase().includes(query) || category.slug.toLowerCase().includes(query),
  )
})

const statuses = [
  { title: 'All Status', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

const isDialogVisible = ref(false)
const isEditMode = ref(false)
const editingCategory = ref<Category | null>(null)
const isDeleteDialogVisible = ref(false)
const deleteId = ref<number | null>(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const openAddDialog = () => {
  isEditMode.value = false
  editingCategory.value = null
  isDialogVisible.value = true
}

const openEditDialog = (category: Category) => {
  isEditMode.value = true
  editingCategory.value = { ...category }
  isDialogVisible.value = true
}

const confirmDelete = (id: number) => {
  deleteId.value = id
  isDeleteDialogVisible.value = true
}

const deleteCategory = async () => {
  if (!deleteId.value)
    return

  try {
    await $api(`/categories/${deleteId.value}`, { method: 'DELETE' })
    showSnackbar('Category deleted successfully!', 'error')
    isDeleteDialogVisible.value = false
    deleteId.value = null
    fetchCategories()
  }
  catch (error) {
    showSnackbar('Failed to delete category.', 'error')
  }
}

const formData = ref({
  name: '',
  slug: '',
  description: '',
  status: 'active',
})

watch(() => editingCategory.value, val => {
  if (val) {
    formData.value = {
      name: val.name ?? '',
      slug: val.slug ?? '',
      description: val.description ?? '',
      status: val.status ?? 'active',
    }
  }
  else {
    formData.value = {
      name: '',
      slug: '',
      description: '',
      status: 'active',
    }
  }
}, { immediate: true })

const saveCategory = async () => {
  try {
    if (isEditMode.value && editingCategory.value?.id) {
      await $api(`/categories/${editingCategory.value.id}`, {
        method: 'PUT',
        body: { ...formData.value },
      })
      showSnackbar('Category updated successfully!')
    }
    else {
      await $api('/categories/', {
        method: 'POST',
        body: { ...formData.value },
      })
      showSnackbar('Category created successfully!')
    }

    isDialogVisible.value = false
    fetchCategories()
  }
  catch (error) {
    showSnackbar('Failed to save category.', 'error')
  }
}

watch([selectedStatus, page, itemsPerPage], () => {
  fetchCategories()
})
</script>

<template>
  <section>
    <VCard title="Product Categories">
      <VCardText>
        <VRow>
          <VCol cols="12" md="5">
            <VTextField
              v-model="searchQuery"
              placeholder="Search Category"
              prepend-inner-icon="tabler-search"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="4">
            <VSelect
              v-model="selectedStatus"
              :items="statuses"
              label="Status"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="3" class="d-flex align-center justify-end">
            <VBtn prepend-icon="tabler-plus" @click="openAddDialog">
              Add Category
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDataTableServer
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="filteredCategories"
        :items-length="totalCategories"
        class="text-no-wrap"
      >
        <template #item.status="{ item }">
          <VChip
            :color="item.status === 'active' ? 'success' : 'secondary'"
            size="small"
            class="text-capitalize"
          >
            {{ item.status }}
          </VChip>
        </template>

        <template #item.created_at="{ item }">
          {{ item.created_at ? new Date(item.created_at).toLocaleDateString() : '-' }}
        </template>

        <template #item.actions="{ item }">
          <VBtn icon variant="text" size="x-small" @click="openEditDialog(item)">
            <VIcon icon="tabler-edit" :size="22" />
          </VBtn>
          <VBtn icon variant="text" color="error" size="x-small" @click="confirmDelete(item.id)">
            <VIcon icon="tabler-trash" :size="22" />
          </VBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <VDialog v-model="isDialogVisible" max-width="600">
      <VCard :title="isEditMode ? 'Edit Category' : 'Add Category'">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField v-model="formData.name" label="Name" />
            </VCol>
            <VCol cols="12">
              <VTextField v-model="formData.slug" label="Slug" />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="formData.description" label="Description" rows="3" />
            </VCol>
            <VCol cols="12">
              <VSelect v-model="formData.status" :items="statuses.filter(s => s.value !== 'all')" label="Status" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="tonal" color="secondary" @click="isDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveCategory">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard title="Confirm Delete">
        <VCardText>
          Are you sure you want to delete this category? This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="tonal" color="secondary" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="deleteCategory">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </VSnackbar>
  </section>
</template>
