<template>
  <div class="form-group" :class="colSpan">
    <label v-if="label" class="form-label">
      {{ label }} <span v-if="required">*</span>
    </label>

    <input
      class="form-input"
      :list="listId"
      :placeholder="placeholder"
      :required="required"
      :readonly="readonly"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <datalist :id="listId">
      <option
        v-for="opt in options"
        :key="opt.id"
        :value="opt.id"
      >
        {{ opt.label }}
      </option>
    </datalist>
  </div>
</template>

<script>
export default {
  name: 'SearchInput',

  props: {
    modelValue: [String, Number],
    label: String,
    options: {
      type: Array,
      default: () => [],
    },
    placeholder: String,
    required: Boolean,
    readonly: Boolean,
    colSpan: {
      type: String,
      default: 'col-span-4',
    },
  },

  data() {
    return {
      listId: `list-${crypto.randomUUID()}`, // ✅ correto no Vue 3
    }
  },
}

</script>
