from django.urls import path, re_path
from . import auth_views
from . import events_views
from . import registrations_views
from . import reviews_views
from . import analytics_views
from . import integrations_views
from . import razorpay_views
from . import contact_views
from . import whatsapp_views
from . import google_auth_views
from . import trip_views
from . import trip_share_views


urlpatterns = [
    # Auth
    path('auth/login', auth_views.login_view),
    path('auth/verify', auth_views.verify_view),
    path('auth/logout', auth_views.logout_view),

    # Consumer ("traveler") auth — Google Sign-In, separate from the admin login above
    path('auth/google', google_auth_views.google_login_view),
    path('auth/me', google_auth_views.current_user_view),

    # Trip Planner
    path('trips', trip_views.trips_list),
    path('trips/<str:pk>', trip_views.trip_detail),
    path('trips/<str:pk>/generate', trip_views.trip_generate),
    path('trips/<str:pk>/regenerate', trip_views.trip_regenerate),
    path('trips/<str:pk>/status', trip_views.trip_status),
    path('trips/<str:pk>/share', trip_share_views.trip_share_email),
    path('trips/<str:pk>/share-link', trip_share_views.trip_share_link),
    path('trips/<str:pk>/shares', trip_share_views.trip_shares_list),
    path('trips/<str:pk>/shares/<str:share_id>/revoke', trip_share_views.trip_share_revoke),

    # Public — opened from a shared-trip email/link, no auth required
    path('shared-trips/<str:token>', trip_share_views.shared_trip_public_view),

    # Events
    path('events', events_views.events_list),
    path('events/<str:pk>', events_views.event_detail),
    
    # Registrations
    path('my/registrations', registrations_views.my_registrations_view),
    path('registrations', registrations_views.registrations_list),
    path('registrations/export', registrations_views.export_registrations),
    path('registrations/invite-whatsapp', registrations_views.invite_whatsapp),
    path('registrations/<str:pk>', registrations_views.registration_detail),
    path('registrations/<str:pk>/payment', registrations_views.registration_payment),
    
    # Reviews
    path('reviews', reviews_views.reviews_list),
    path('reviews/<str:pk>/status', reviews_views.update_review_status),
    path('reviews/<str:pk>', reviews_views.delete_review),
    
    # Analytics
    path('analytics/dashboard', analytics_views.dashboard_stats),
    path('analytics/registrations/monthly', analytics_views.monthly_registrations),
    path('analytics/events/participation', analytics_views.event_participation_stats),
    
    # Uploads (Cloudinary)
    path('upload/image', integrations_views.upload_image),
    path('upload/video', integrations_views.upload_video),
    path('upload/payment-screenshot', integrations_views.upload_payment_screenshot),
    re_path(r'^upload/(?P<pk>.+)$', integrations_views.delete_file), # For cloudinary public ids with slashes
    
    # Razorpay Payments
    path('payments/create-order', razorpay_views.create_order),
    path('payments/verify', razorpay_views.verify_payment),
    
    # Google Sheets
    path('integrations/google-sheets/connect', integrations_views.connect_google_sheets),
    path('integrations/google-sheets/sync', integrations_views.sync_google_sheets),
    path('integrations/google-sheets/status', integrations_views.google_sheets_status),
    
    # Contact
    path('contact', contact_views.contact_form),

    # WhatsApp Integration
    path('members/register', whatsapp_views.register_member),
    path('admin/whatsapp/broadcast', whatsapp_views.broadcast_welcome),
    path('admin/whatsapp/members', whatsapp_views.list_members),
    path('admin/whatsapp/members/<str:pk>', whatsapp_views.update_member_phone),
    path('admin/whatsapp/members/<str:pk>/delete', whatsapp_views.delete_member),
    path('admin/whatsapp/members/<str:pk>/retry', whatsapp_views.retry_member),
    path('whatsapp/webhook', whatsapp_views.whatsapp_webhook),
]