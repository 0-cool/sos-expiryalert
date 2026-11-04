import { fireEvent, render, screen } from '@testing-library/react-native';

import { DocumentForm } from '@/components/documents/DocumentForm';
import type { DocumentFormValues } from '@/features/documents/validation';
import i18n from '@/i18n';
import { AppThemeProvider } from '@/theme/ThemeProvider';

const empty: DocumentFormValues = {
  documentType: null,
  documentName: '',
  expirationDate: null,
  notes: '',
  reminderDays: [90, 30, 7, 1],
};

async function renderForm(
  initialValues: DocumentFormValues,
  onSubmit = jest.fn(async () => undefined),
  enableScan = false,
) {
  await render(
    <AppThemeProvider preference="light">
      <DocumentForm
        initialValues={initialValues}
        submitLabel="Save document"
        reminderTimeLabel="9:00 AM"
        enableScan={enableScan}
        onSubmit={onSubmit}
      />
    </AppThemeProvider>,
  );
  return onSubmit;
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('<DocumentForm />', () => {
  it('shows translated validation errors and does not submit an empty form', async () => {
    const onSubmit = await renderForm(empty);
    await fireEvent.press(screen.getByTestId('document-form-submit'));
    expect(await screen.findByText('Choose a document type.')).toBeTruthy();
    expect(screen.getByText('Enter a name for this document.')).toBeTruthy();
    expect(screen.getByText('Choose the expiration date.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a clean input with only the minimal fields', async () => {
    const onSubmit = await renderForm({ ...empty, expirationDate: '2030-11-15' });
    await fireEvent.press(screen.getByTestId('type-passport'));
    await fireEvent.changeText(screen.getByTestId('document-name-input'), '  John Smith ');
    await fireEvent.press(screen.getByTestId('reminder-180'));
    await fireEvent.press(screen.getByTestId('document-form-submit'));
    expect(onSubmit).toHaveBeenCalledWith({
      documentType: 'passport',
      documentName: 'John Smith',
      expirationDate: '2030-11-15',
      notes: null,
      reminderDays: [180, 90, 30, 7, 1],
    });
  });

  it('warns (without blocking) when a name looks like an identification number', async () => {
    await renderForm(empty);
    await fireEvent.changeText(screen.getByTestId('document-name-input'), 'Passport 123456789');
    expect(
      screen.getByText(
        'This looks like an identification number. For your privacy, please don’t store document numbers.',
      ),
    ).toBeTruthy();
  });

  it('shows the privacy message', async () => {
    await renderForm(empty);
    expect(
      screen.getByText(
        'Your privacy matters. We only store the information needed to remind you about expiration dates.',
      ),
    ).toBeTruthy();
  });

  it('offers scanning on the new-document form while keeping reminders and notes editable', async () => {
    await renderForm(empty, undefined, true);
    expect(screen.getByTestId('document-form-scan')).toBeTruthy();
    expect(screen.getByTestId('document-form-voice')).toBeTruthy();
    expect(screen.getByText('Example: “Add my driver’s license, John Smith, expiring December 22, 2026.”')).toBeTruthy();
    expect(screen.getByText('We’ll read the type, name and expiration date on this device. The image is deleted and never uploaded. Review the suggestions, then choose reminders and add notes.')).toBeTruthy();
    expect(screen.getByText('Speech is recognized on this device only; audio is not uploaded. Say the document type, owner name and expiration date. Review the suggestions before saving. Your device needs the matching offline speech language.')).toBeTruthy();
    expect(screen.getByText('Remind me')).toBeTruthy();
    expect(screen.getByText('Notes')).toBeTruthy();
  });

  it('shows the reminder time and the "past date" hint', async () => {
    await renderForm({ ...empty, expirationDate: '2001-01-01' });
    expect(screen.getByText('Notifications arrive at 9:00 AM.')).toBeTruthy();
    expect(screen.getByText('This date has already passed. The document will be marked as expired.')).toBeTruthy();
  });
});
