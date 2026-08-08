"""
GRADSKOOL — Leads Signals

Connects lead creation and drip enrollment to key platform events:

  post_save(ToolLead)      → Upsert Lead + trigger 'tool_gate' sequence
  post_save(User)          → Upsert Lead + trigger 'registration' sequence
  post_save(Enrollment)    → Mark lead as converted + pause sequences
  post_save(Order, paid)   → Trigger 'post_purchase' sequence

All sequence triggers are dispatched as Celery tasks (async)
so they never slow down the request that caused them.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='tools.ToolLead')
def on_tool_lead_created(sender, instance, created, **kwargs):
    """
    When a tool gate is submitted:
    1. Upsert a Lead record
    2. Enroll in the tool_gate drip sequence
    """
    if not created:
        return
    try:
        from apps.leads.services import upsert_lead
        from apps.leads.tasks import trigger_sequence_for_lead

        lead, _ = upsert_lead(
            email=instance.email,
            first_name=instance.name.split()[0] if instance.name else '',
            last_name=' '.join(instance.name.split()[1:]) if instance.name else '',
            target_exam=instance.target_exam,
            source_type='tool_gate',
            source_detail=instance.tool.slug,
            ip=str(instance.ip_address) if instance.ip_address else '',
        )
        trigger_sequence_for_lead.delay(
            lead_id=lead.id,
            trigger_event='tool_gate',
            exam=instance.target_exam,
        )
        logger.info(f'Lead from tool gate: {instance.email} → {instance.tool.slug}')
    except Exception as exc:
        logger.exception(f'on_tool_lead_created failed: {exc}')


@receiver(post_save, sender='accounts.User')
def on_user_registered(sender, instance, created, **kwargs):
    """
    When a new user registers:
    1. Upsert or link Lead
    2. Enroll in the registration drip sequence
    """
    if not created:
        return
    try:
        from apps.leads.services import upsert_lead
        from apps.leads.tasks import trigger_sequence_for_lead

        lead, _ = upsert_lead(
            email=instance.email,
            first_name=instance.first_name,
            last_name=instance.last_name,
            phone=instance.phone,
            target_exam=instance.target_exam,
            source_type='registration',
            source_detail='gradskool.in/register',
            user=instance,
        )
        trigger_sequence_for_lead.delay(
            lead_id=lead.id,
            trigger_event='registration',
            exam=instance.target_exam,
        )
        logger.info(f'Lead from registration: {instance.email}')
    except Exception as exc:
        logger.exception(f'on_user_registered failed: {exc}')


@receiver(post_save, sender='enrollments.Enrollment')
def on_enrollment_created(sender, instance, created, **kwargs):
    """
    When an enrollment is activated (payment confirmed):
    1. Mark lead as converted
    2. Trigger 'post_purchase' drip sequence
    """
    if not created:
        return
    if instance.status != 'active':
        return
    try:
        from apps.leads.models import Lead
        from apps.leads.tasks import trigger_sequence_for_lead

        try:
            lead = Lead.objects.get(email=instance.user.email)
            lead.mark_converted(plan=instance.plan)
            trigger_sequence_for_lead.delay(
                lead_id=lead.id,
                trigger_event='post_purchase',
                exam=instance.plan.exam.slug,
            )
            logger.info(
                f'Lead converted: {instance.user.email} → {instance.plan.name}'
            )
        except Lead.DoesNotExist:
            pass   # Lead record may not exist if user signed up via social auth
    except Exception as exc:
        logger.exception(f'on_enrollment_created failed: {exc}')
