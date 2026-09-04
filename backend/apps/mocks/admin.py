from django.contrib import admin

from .models import MockAttempt, MockPaper, MockPassage, MockQuestion, MockResponse, MockSection, MockTopic


class MockSectionInline(admin.TabularInline):
    model = MockSection
    extra = 0


@admin.register(MockPaper)
class MockPaperAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam', 'test_type', 'is_free', 'is_active', 'sort_order']
    list_filter = ['exam', 'test_type', 'is_active', 'is_free']
    search_fields = ['title']
    inlines = [MockSectionInline]


@admin.register(MockSection)
class MockSectionAdmin(admin.ModelAdmin):
    list_display = ['paper', 'name', 'time_limit_mins', 'order']
    list_filter = ['paper__exam']


@admin.register(MockTopic)
class MockTopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'exam', 'section_name', 'parent', 'order']
    list_filter = ['exam', 'section_name']
    search_fields = ['name']


@admin.register(MockPassage)
class MockPassageAdmin(admin.ModelAdmin):
    list_display = ['section', 'order']


@admin.register(MockQuestion)
class MockQuestionAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'section', 'topic', 'order', 'question_type', 'difficulty', 'is_active']
    list_filter = ['question_type', 'difficulty', 'is_active']
    search_fields = ['question_text']


@admin.register(MockAttempt)
class MockAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'exam', 'mode', 'started_at', 'completed', 'score']
    list_filter = ['exam', 'mode', 'completed']
    search_fields = ['user__email']


@admin.register(MockResponse)
class MockResponseAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_option', 'is_correct', 'marks_awarded']
