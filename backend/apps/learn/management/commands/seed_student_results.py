"""
GRADSKOOL — Seed real student result stories

The 5 original, advanced student-story pages (video interview,
narrative, pull-quote, WhatsApp-style testimonial, outcome box)
extracted from the original site HTML — real content, not invented.

Safe to run repeatedly — uses update_or_create by slug.

Usage:
    python manage.py seed_student_results
"""
from django.core.management.base import BaseCommand


STORIES = [
    {
        'slug': 'avivratta-krishna-nmims-mumbai',
        'name': 'Avivratta Krishna',
        'exam': 'nmat',
        'tag': 'NMIMS Convert',
        'subtitle': 'Avivratta Krishna converted NMIMS Mumbai Core MBA. Constant guidance and mentorship from the GRADSKOOL team throughout the journey.',
        'college_calls': 'NMIMS Mumbai — Core MBA',
        'body': "Avivratta Krishna's journey to NMIMS Mumbai Core was defined by one thing above all else — consistent mentorship. Not just for the exam, but throughout the entire selection process. From NMAT preparation to the final GDPI rounds, the GRADSKOOL team was present at every stage.",
        'pull_quote': "A big thank you to ALP Sir and the entire team at Gradskool for their constant guidance, mentorship, and belief in me throughout this journey. Couldn't have done it without your support.",
        'whatsapp_message': "Grateful to have converted NMIMS Mumbai Core! A big thank you to ALP Sir and the entire team at Gradskool for their constant guidance, mentorship, and belief in me throughout this journey\nCouldn't have done it without your support!",
        'outcome_label': 'Outcome',
        'outcome_value': 'NMIMS Mumbai — Core MBA',
        'outcome_description': 'Avivratta converted NMIMS Mumbai Core MBA — joining Prathamesh Mulay from the same GRADSKOOL batch at the same institution.',
        'video_type': 'youtube',
        'video_url': 'https://www.youtube.com/watch?v=FgpGVKfMUVA',
        'meta_title': 'Avivratta Krishna — NMIMS Mumbai Core | GRADSKOOL Student Story',
        'meta_description': 'Avivratta Krishna converted NMIMS Mumbai Core MBA with GRADSKOOL. Full journey from NMAT preparation to final selection. Read her story.',
    },
    {
        'slug': 'dhruv-jangid-imt-ghaziabad',
        'name': 'Dhruv Jangid',
        'exam': 'nmat',
        'tag': 'IMT Convert',
        'subtitle': 'Dhruv Jangid converted IMT Ghaziabad with GRADSKOOL. Rigorous sessions and post-mock feedback made the difference.',
        'college_calls': 'IMT Ghaziabad — PGDM',
        'body': 'Dhruv Jangid came to GRADSKOOL looking for structure — a clear path through CAT preparation that did not leave him guessing about what to do next. The rigorous live sessions and the post-mock feedback process gave him exactly that. Every mock was not just a test but a diagnostic session that shaped the next phase of preparation.',
        'pull_quote': 'The sessions were rigorous and the feedback after every mock was unlike anything I had experienced before.',
        'whatsapp_message': 'GRADSKOOL gave me the structure and clarity I needed at every stage of my preparation\nThe sessions were rigorous and the feedback after every mock was unlike anything I had experienced before.',
        'outcome_label': 'Outcome',
        'outcome_value': 'IMT Ghaziabad — PGDM',
        'outcome_description': "Dhruv converted IMT Ghaziabad — one of India's top PGDM programmes with strong placements in Finance and Marketing.",
        'video_type': 'youtube',
        'video_url': 'https://www.youtube.com/watch?v=eJbI-rQzd-Q',
        'meta_title': 'Dhruv Jangid — IMT Ghaziabad | GRADSKOOL Student Story',
        'meta_description': 'Dhruv Jangid converted IMT Ghaziabad with GRADSKOOL. Structured CAT preparation, rigorous sessions and post-mock analysis. Read his story.',
    },
    {
        'slug': 'prathamesh-mulay-nmims-mumbai',
        'name': 'Prathamesh Mulay',
        'exam': 'nmat',
        'tag': 'NMIMS Convert',
        'subtitle': 'Prathamesh Mulay converted NMIMS Mumbai Core MBA. The Competency Test mock preparation was the turning point.',
        'college_calls': 'NMIMS Mumbai — Core MBA',
        'body': 'Prathamesh Mulay came to GRADSKOOL targeting NMIMS Mumbai. The preparation was intense — marathon sessions, structured mocks, and specific Competency Test practice that NMIMS requires beyond the NMAT score. The guidance was not just about the exam but about the complete selection process.',
        'pull_quote': 'The Competency Test mock was absolutely fantastic, and the marathon sessions were intense and incredibly fruitful and played a key role in strengthening my preparation.',
        'whatsapp_message': 'Grateful to share that I have converted NMIMS Mumbai – Core MBA\nThis milestone would not have been possible without the constant guidance and support of ALP Sir and the entire GradSkool team\nThe Competency Test mock was absolutely fantastic, and the marathon sessions were intense and incredibly fruitful and played a key role in strengthening my preparation\nTruly thankful for the mentorship and support throughout this journey.',
        'outcome_label': 'Outcome',
        'outcome_value': 'NMIMS Mumbai — Core MBA',
        'outcome_description': 'Prathamesh converted NMIMS Mumbai Core MBA — one of the most sought-after MBA programmes in India for Finance and Marketing.',
        'video_type': 'youtube',
        'video_url': 'https://www.youtube.com/watch?v=cPdaYUZ_9AE',
        'meta_title': 'Prathamesh Mulay — NMIMS Mumbai Core MBA | GRADSKOOL Student Story',
        'meta_description': 'Prathamesh Mulay converted NMIMS Mumbai Core MBA with GRADSKOOL. Structured NMAT preparation, Competency Test mocks and marathon sessions. Read his story.',
    },
    {
        'slug': 'shubhayu-das-nmims-imi-imt',
        'name': 'Shubhayu Das',
        'exam': 'nmat',
        'tag': 'Multiple Converts',
        'subtitle': 'Shubhayu Das prepared for CAT while working full-time. He converted NMIMS, IMI Delhi and IMT Ghaziabad. The GDPI preparation was the difference.',
        'college_calls': 'NMIMS · IMI Delhi · IMT Ghaziabad',
        'body': 'Shubhayu Das was not a full-time student. He was managing a job while preparing for CAT and MBA entrance exams — one of the hardest things to do in the Indian MBA preparation journey. The balance was demanding. What made the difference was structured mentorship that understood his constraints and the GDPI guidance that prepared him specifically for the interview process.',
        'pull_quote': 'The GDPI guidance from the Gradskool team in particular was instrumental in building my confidence and helped me in developing a clear, structured approach to articulate my responses.',
        'whatsapp_message': 'The preparation phase was quite demanding for me, balancing studies alongside a full-time job was challenging, but the mentorship of Abhishek Sir made a significant difference\nThe GDPI guidance from Gradskool team in particular, was instrumental in building my confidence and helped me in developing a clear, structured approach to articulate my responses.',
        'outcome_label': 'Outcome',
        'outcome_value': 'NMIMS · IMI Delhi · IMT Ghaziabad',
        'outcome_description': 'Shubhayu converted three programmes — NMIMS, IMI Delhi and IMT Ghaziabad — while working a full-time job. A result that speaks to what structured preparation can do even under the hardest constraints.',
        'video_type': 'youtube',
        'video_url': 'https://www.youtube.com/watch?v=gCrfgO7Fgh8',
        'meta_title': 'Shubhayu Das — NMIMS, IMI, IMT | GRADSKOOL Student Story',
        'meta_description': 'Shubhayu Das prepared for CAT while working full-time and converted NMIMS, IMI Delhi and IMT Ghaziabad with GRADSKOOL. Read his story.',
    },
    {
        'slug': 'sreeja-biswas-iim-kozhikode',
        'name': 'Sreeja Biswas',
        'exam': 'cat',
        'tag': 'Student of ALP Sir',
        'subtitle': "Sreeja Biswas was a student of ALP Sir's before GRADSKOOL existed. She got into IIM Kozhikode. Her story is part of why GRADSKOOL was built.",
        'college_calls': 'IIM Kozhikode — PGP',
        'body': 'Sreeja Biswas was a student of ALP Sir, before he founded GRADSKOOL. She came to him with a problem that goes beyond syllabus — a genuine, deep fear of mathematics that had made her question whether she could attempt CAT at all. What followed over the next few months became one of the clearest examples of what mentorship, as opposed to mere teaching, can do.',
        'pull_quote': 'I truly never thought I would go through with giving the exam because I was so horribly scared of maths, but your teaching helped me through it.',
        'whatsapp_message': "Sreeja this side, i have been a student of ALP Sir\nCAT was below subpar for me since i wasn't very good in math\nI am writing this to you just to express my gratitude, i truly never thought i would go through with giving the exam because i was so horribly scared of maths, but your teaching helped me through it\nI am disappointed with my performance but I am also content because this journey has been nothing short of transformative, and it's truly because of a teacher like you, i truly wish i had you as a maths teacher in school\nI am extremely grateful to you sir\nhello sir\ni got into iim k\nthank you so much for all your help",
        'outcome_label': 'Outcome',
        'outcome_value': 'IIM Kozhikode — PGP',
        'outcome_description': "Sreeja converted IIM Kozhikode. The student who almost did not give CAT because of maths fear is now at one of India's top five IIMs.",
        'video_type': 'youtube',
        'video_url': 'https://www.youtube.com/watch?v=cbRMcdEnw0s',
        'meta_title': 'Sreeja Biswas — IIM Kozhikode | GRADSKOOL Student Story',
        'meta_description': 'Sreeja Biswas was scared of maths and almost skipped CAT. She prepared with GRADSKOOL and converted IIM Kozhikode. Read her full story and watch the interview.',
    },
]


class Command(BaseCommand):
    help = 'Seed real student result stories extracted from the original site HTML'

    def handle(self, *args, **options):
        from apps.learn.models import StudentResult

        created, updated = 0, 0
        for s in STORIES:
            r, was_created = StudentResult.objects.update_or_create(
                slug=s['slug'],
                defaults={
                    'name': s['name'],
                    'exam': s['exam'],
                    'year': 2026,
                    'percentile': 0,
                    'college_calls': s['college_calls'],
                    'testimonial': s['whatsapp_message'],
                    'is_verified': True,
                    'is_featured': True,
                    'video_type': s['video_type'],
                    'video_url': s['video_url'],
                    'body': s['body'],
                    'meta_title': s['meta_title'],
                    'meta_description': s['meta_description'],
                    'tag': s['tag'],
                    'subtitle': s['subtitle'],
                    'pull_quote': s['pull_quote'],
                    'whatsapp_message': s['whatsapp_message'],
                    'outcome_label': s['outcome_label'],
                    'outcome_value': s['outcome_value'],
                    'outcome_description': s['outcome_description'],
                },
            )
            if was_created:
                created += 1
                self.stdout.write(f'  ✓ Created: {s["name"]}')
            else:
                updated += 1
                self.stdout.write(f'  ↻ Updated: {s["name"]}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {created} created, {updated} updated.'
        ))