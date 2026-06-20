/**
 * Supabase-ready database types for ViralStudio AI Admin
 * These serve as documentation and future migration reference.
 * When Supabase is connected, replace mock data with Supabase queries.
 */

export const TABLE_NAMES = {
  profiles: 'profiles',
  user_credits: 'user_credits',
  credit_transactions: 'credit_transactions',
  ai_tools: 'ai_tools',
  ai_models: 'ai_models',
  generations: 'generations',
  clipping_jobs: 'clipping_jobs',
  ugc_assets: 'ugc_assets',
  hook_frameworks: 'hook_frameworks',
  templates: 'templates',
  plans: 'plans',
  payments: 'payments',
  affiliates: 'affiliates',
  support_tickets: 'support_tickets',
  admin_logs: 'admin_logs',
  app_settings: 'app_settings',
};

/** @typedef {{ id: string, email: string, name: string, avatar_url?: string, role: 'user'|'admin', plan: string, credits: number, status: 'active'|'suspended'|'banned', total_generations: number, signup_date: string, last_login: string, created_at: string }} Profile */

/** @typedef {{ id: string, user_id: string, balance: number, total_purchased: number, total_used: number, total_refunded: number, updated_at: string }} UserCredits */

/** @typedef {{ id: string, user_id: string, type: 'purchase'|'usage'|'refund'|'manual_add'|'manual_remove', tool?: string, model?: string, amount: number, reason: string, created_at: string }} CreditTransaction */

/** @typedef {{ id: string, name: string, slug: string, icon: string, description: string, status: 'active'|'inactive', credit_cost_mode: 'fixed'|'per_generation'|'per_second', featured: boolean, coming_soon: boolean, display_order: number, allowed_plans: string[], created_at: string }} AiTool */

/** @typedef {{ id: string, name: string, provider: string, api_model_id: string, tool_category: string, version: string, credit_cost: number, real_api_cost: number, profit_margin: number, status: 'active'|'inactive', duration_options?: string[], resolution_options?: string[], aspect_ratio_options?: string[], quantity_limits?: number[], allowed_plans: string[], featured: boolean, options?: Object, created_at: string }} AiModel */

/** @typedef {{ id: string, user_id: string, user_name?: string, tool: string, model: string, prompt: string, input_files?: string[], output_file?: string, status: 'pending'|'processing'|'completed'|'failed', credits_used: number, error_message?: string, created_at: string }} Generation */

/** @typedef {{ id: string, user_id: string, user_name?: string, video_name: string, file_size: number, reels_requested: number, clip_length: number, aspect_ratio: string, status: 'pending'|'processing'|'completed'|'failed'|'cancelled', generated_reels: number, failed_clips: number, credits_used: number, created_at: string }} ClippingJob */

/** @typedef {{ id: string, name: string, prompt_template: string, description: string, languages: string[], status: 'active'|'inactive', example_output?: string, created_at: string }} HookFramework */

/** @typedef {{ id: string, title: string, prompt: string, category: string, tool: string, thumbnail?: string, status: 'active'|'inactive', featured: boolean, created_at: string }} Template */

/** @typedef {{ id: string, name: string, monthly_price: number, yearly_price: number, credits_included: number, max_video_generations: number, max_image_generations: number, max_clipping_jobs: number, max_ugc_ads: number, max_chat_messages: number, allowed_tools: string[], watermark: boolean, priority_processing: boolean, status: 'active'|'inactive', created_at: string }} Plan */

/** @typedef {{ id: string, user_id: string, user_name?: string, plan: string, amount: number, currency: string, provider: 'stripe'|'paypal'|'manual', status: 'paid'|'failed'|'refunded'|'pending', invoice_link?: string, created_at: string }} Payment */

/** @typedef {{ id: string, name: string, email: string, code: string, link: string, clicks: number, signups: number, paid_users: number, revenue: number, commission_rate: number, commission_earned: number, status: 'active'|'inactive'|'pending', created_at: string }} Affiliate */

/** @typedef {{ id: string, user_id: string, user_name?: string, subject: string, message: string, priority: 'low'|'medium'|'high', status: 'open'|'closed'|'resolved', admin_note?: string, created_at: string }} SupportTicket */

/** @typedef {{ id: string, action: string, type: 'admin'|'user'|'credit'|'payment'|'api'|'model'|'login', user_id?: string, admin_id?: string, severity: 'info'|'warning'|'error', details?: string, created_at: string }} AdminLog */

/** @typedef {{ key: string, value: any, category: string, updated_at: string }} AppSetting */
