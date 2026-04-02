from django.urls import path, re_path
from . import auth_views
from . import events_views
from . import registrations_views
from . import reviews_views
from . import analytics_views
from . import integrations_views
from . import razorpay_views
from . import contact_views

urlpatterns = [
    # Auth
    path('auth/login', auth_views.login_view),
    path('auth/verify', auth_views.verify_view),
    path('auth/logout', auth_views.logout_view),
    
    # Events
    path('events', events_views.events_list),
    path('events/<str:pk>', events_views.event_detail),
    
    # Registrations
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
]
