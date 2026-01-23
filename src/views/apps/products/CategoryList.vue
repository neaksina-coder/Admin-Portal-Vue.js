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
  { title: 'CATEGORY', key: 'name', width: '30%' },
  { title: 'SLUG', key: 'slug', width: '25%' },
  { title: 'STATUS', key: 'status', width: '15%' },
  { title: 'CREATED', key: 'created_at', width: '20%' },
  { title: 'ACTIONS', key: 'actions', sortable: false, width: '10%', align: 'end' },
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
const isFormValid = ref(false)

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

const generateSlug = () => {
  if (formData.value.name && !isEditMode.value) {
    formData.value.slug = formData.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

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

const closeDialog = () => {
  isDialogVisible.value = false
  formData.value = {
    name: '',
    slug: '',
    description: '',
    status: 'active',
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const resolveStatusVariant = (status: string) => {
  if (status === 'active') return { color: 'success', text: 'Active', icon: 'tabler-circle-check' }
  if (status === 'inactive') return { color: 'error', text: 'Inactive', icon: 'tabler-circle-x' }
  return { color: 'warning', text: status, icon: 'tabler-clock' }
}

const getCategoryColor = (index: number) => {
  const colors = ['primary', 'info', 'success', 'warning', 'error', 'secondary']
  return colors[index % colors.length]
}

watch([selectedStatus, page, itemsPerPage], () => {
  fetchCategories()
})
</script>

<template>
  <section>
    <!-- Header Card with Stats -->
    <VCard class="mb-6" elevation="0">
      <VCardText class="pa-8">
        <div class="d-flex flex-wrap align-center justify-space-between gap-6 mb-8">
          <div>
            <div class="d-flex align-center gap-3 mb-2">
              <VIcon icon="tabler-category" size="32" color="primary" />
              <h3 class="text-h3 font-weight-bold">
                Product Categories
              </h3>
            </div>
            <p class="text-body-1 text-medium-emphasis mb-0">
              Organize your products into meaningful categories
            </p>
          </div>

          <VBtn
            color="primary"
            size="large"
            elevation="0"
            prepend-icon="tabler-plus"
            class="text-none"
            @click="openAddDialog"
          >
            Add New Category
          </VBtn>
        </div>

        <!-- Stats Row -->
        <VRow class="match-height">
          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="primary" class="stat-card">
              <VCardText class="d-flex align-center gap-4">
                <VAvatar size="48" color="primary" variant="tonal">
                  <VIcon icon="tabler-category" size="28" />
                </VAvatar>
                <div>
                  <div class="text-h4 font-weight-bold">
                    {{ totalCategories }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Total Categories
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="success" class="stat-card">
              <VCardText class="d-flex align-center gap-4">
                <VAvatar size="48" color="success" variant="tonal">
                  <VIcon icon="tabler-circle-check" size="28" />
                </VAvatar>
                <div>
                  <div class="text-h4 font-weight-bold">
                    {{ categories.filter(c => c.status === 'active').length }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Active Categories
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="info" class="stat-card">
              <VCardText class="d-flex align-center gap-4">
                <VAvatar size="48" color="info" variant="tonal">
                  <VIcon icon="tabler-category-2" size="28" />
                </VAvatar>
                <div>
                  <div class="text-h4 font-weight-bold">
                    {{ categories.filter(c => c.status === 'inactive').length }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Inactive Categories
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Table Card -->
    <VCard elevation="0">
      <VCardText class="pa-6">
        <!-- Filters Section -->
        <div class="filters-wrapper mb-6">
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model="searchQuery"
                placeholder="Search by name or slug..."
                prepend-inner-icon="tabler-search"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                v-model="selectedStatus"
                :items="statuses"
                label="Filter by Status"
                prepend-inner-icon="tabler-filter"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </VCol>

            <VCol cols="12" md="3" class="d-flex align-center">
              <VBtn
                variant="outlined"
                color="secondary"
                block
                prepend-icon="tabler-refresh"
                @click="fetchCategories"
              >
                Refresh
              </VBtn>
            </VCol>
          </VRow>
        </div>

        <VDivider class="mb-4" />

        <!-- Data Table -->
        <VDataTableServer
          v-model:page="page"
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredCategories"
          :items-length="totalCategories"
          class="category-table elevation-0"
          hover
        >
          <!-- Category Name -->
          <template #item.name="{ item, index }">
            <div class="d-flex align-center gap-3 py-2">
              <VAvatar
                size="42"
                :color="getCategoryColor(index)"
                variant="tonal"
                rounded
              >
                <VIcon icon="tabler-tag" size="20" />
              </VAvatar>
              <div>
                <div class="text-body-1 font-weight-medium mb-1">
                  {{ item.name }}
                </div>
                <div v-if="item.description" class="text-caption text-medium-emphasis text-truncate" style="max-width: 300px;">
                  {{ item.description }}
                </div>
              </div>
            </div>
          </template>

          <!-- Slug -->
          <template #item.slug="{ item }">
            <VChip
              size="small"
              variant="tonal"
              color="secondary"
              class="font-mono"
            >
              <template #prepend>
                <VIcon icon="tabler-link" size="14" class="me-1" />
              </template>
              {{ item.slug }}
            </VChip>
          </template>

          <!-- Status -->
          <template #item.status="{ item }">
            <VChip
              :color="resolveStatusVariant(item.status).color"
              size="small"
              variant="flat"
              class="text-capitalize font-weight-medium"
            >
              <template #prepend>
                <VIcon :icon="resolveStatusVariant(item.status).icon" size="16" class="me-1" />
              </template>
              {{ resolveStatusVariant(item.status).text }}
            </VChip>
          </template>

          <!-- Created Date -->
          <template #item.created_at="{ item }">
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-calendar" size="16" color="medium-emphasis" />
              <span class="text-body-2">{{ formatDate(item.created_at) }}</span>
            </div>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1 justify-end">
              <VTooltip location="top">
                <template #activator="{ props }">
                  <VBtn
                    icon
                    variant="text"
                    color="default"
                    size="small"
                    v-bind="props"
                    @click="openEditDialog(item)"
                  >
                    <VIcon icon="tabler-edit" size="20" />
                  </VBtn>
                </template>
                <span>Edit Category</span>
              </VTooltip>

              <VTooltip location="top">
                <template #activator="{ props }">
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    v-bind="props"
                    @click="confirmDelete(item.id)"
                  >
                    <VIcon icon="tabler-trash" size="20" />
                  </VBtn>
                </template>
                <span>Delete Category</span>
              </VTooltip>
            </div>
          </template>

          <!-- Empty State -->
          <template #no-data>
            <div class="text-center py-12">
              <VIcon icon="tabler-category-off" size="64" color="disabled" class="mb-4" />
              <h4 class="text-h5 mb-2">
                No Categories Found
              </h4>
              <p class="text-body-2 text-medium-emphasis mb-4">
                {{ searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first category' }}
              </p>
              <VBtn
                v-if="!searchQuery"
                color="primary"
                prepend-icon="tabler-plus"
                @click="openAddDialog"
              >
                Add Your First Category
              </VBtn>
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <!-- Add/Edit Category Dialog -->
    <VDialog
      v-model="isDialogVisible"
      max-width="650"
      persistent
    >
      <VCard elevation="8">
        <VCardTitle class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h4 class="text-h4 mb-1">
                {{ isEditMode ? 'Edit Category' : 'Create New Category' }}
              </h4>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ isEditMode ? 'Update category information' : 'Add a new product category to organize your inventory' }}
              </p>
            </div>
            <VBtn
              icon
              variant="text"
              size="small"
              @click="closeDialog"
            >
              <VIcon icon="tabler-x" />
            </VBtn>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VForm v-model="isFormValid">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="formData.name"
                  label="Category Name"
                  placeholder="Enter category name"
                  prepend-inner-icon="tabler-tag"
                  variant="outlined"
                  :rules="[v => !!v || 'Category name is required']"
                  @blur="generateSlug"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="formData.slug"
                  label="Slug (URL-friendly)"
                  placeholder="category-slug"
                  prepend-inner-icon="tabler-link"
                  variant="outlined"
                  hint="Auto-generated from name, or enter custom slug"
                  persistent-hint
                  :rules="[v => !!v || 'Slug is required']"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="formData.description"
                  label="Description"
                  placeholder="Enter category description (optional)"
                  prepend-inner-icon="tabler-file-text"
                  variant="outlined"
                  rows="3"
                  auto-grow
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="formData.status"
                  :items="statuses.filter(s => s.value !== 'all')"
                  label="Status"
                  prepend-inner-icon="tabler-circle-dot"
                  variant="outlined"
                  :rules="[v => !!v || 'Status is required']"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn
            variant="outlined"
            color="secondary"
            size="large"
            @click="closeDialog"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            size="large"
            :disabled="!isFormValid"
            @click="saveCategory"
          >
            {{ isEditMode ? 'Update Category' : 'Create Category' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="500"
      persistent
    >
      <VCard>
        <VCardTitle class="pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar color="error" variant="tonal" size="40">
              <VIcon icon="tabler-alert-triangle" size="24" />
            </VAvatar>
            <div>
              <h5 class="text-h5">
                Delete Category
              </h5>
              <p class="text-body-2 text-medium-emphasis mb-0">
                This action cannot be undone
              </p>
            </div>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VAlert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <VAlertTitle>Warning</VAlertTitle>
            Products in this category will be uncategorized.
          </VAlert>
          <p class="text-body-1">
            Are you sure you want to permanently delete this category? All products currently assigned to this category will be marked as uncategorized.
          </p>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn
            variant="outlined"
            color="secondary"
            size="large"
            @click="isDeleteDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            size="large"
            prepend-icon="tabler-trash"
            @click="deleteCategory"
          >
            Delete Category
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar Notifications -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top end"
      elevation="4"
    >
      <div class="d-flex align-center gap-3">
        <VIcon
          :icon="snackbarColor === 'success' ? 'tabler-circle-check' : 'tabler-alert-circle'"
          size="20"
        />
        <span class="font-weight-medium">{{ snackbarText }}</span>
      </div>
    </VSnackbar>
  </section>
</template>

<style scoped lang="scss">
.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.filters-wrapper {
  background: rgba(var(--v-theme-surface), 0.4);
  border-radius: 12px;
  padding: 20px;
}

.category-table {
  :deep(.v-data-table__th) {
    font-weight: 600 !important;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }

  :deep(.v-data-table__tr) {
    transition: all 0.2s ease;

    &:hover {
      background: rgba(var(--v-theme-primary), 0.04);
    }
  }

  :deep(.v-data-table__td) {
    padding-block: 12px !important;
  }
}

.font-mono {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

:deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.25px;
}
</style>
