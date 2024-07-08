// src/routes/content/[id]/edit/+page.server.ts
import { z } from 'zod';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { contentService } from '$lib/server/db/services/content';
import { tagService } from '$lib/server/db/services/tags';
import { tags } from '$lib/server/db/schema.js';

const schema = z.object({
	id: z.number(),
	title: z.string().min(1, 'Title is required'),
	type: z.enum(['recipe', 'video']),
	body: z.string().min(1, 'Body is required'),
	slug: z.string().min(1, 'Slug is required'),
	description: z.string().min(1, 'Description is required'),
	tags: z.array(z.number()).min(1, 'At least one tag is required')
});

export const load = async ({ params }) => {
	// const result = await contentService.get_content(parseInt(params.id));
	const [res_content, res_tags] = await Promise.all([
		contentService.get_content(parseInt(params.id)),
		tagService.get_tags()
	]);
	if (!res_content.data || !res_tags.data) {
		redirect(302, '/content');
	}

	const dto = { ...res_content.data, tags: res_content.data.tags.map(t => t.id) }

	const form = await superValidate(dto, zod(schema));
	return {
		form,
		tags: res_tags.data
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(schema));
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			await contentService.update_content(form.data.id, form.data);
			redirect(304, '/content');
		} catch (error) {
			return message(form, 'Failed to update content.');
		}
	}
};
