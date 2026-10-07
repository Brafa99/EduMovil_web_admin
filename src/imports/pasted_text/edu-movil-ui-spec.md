FRONTEND TASK 1 — BUILD THE COMPLETE EDUMOVIL WEB APPLICATION UI
Create a complete, polished, responsive React web application for an educational management platform called EduMovil.
This is the first frontend implementation of a larger system. The application must be structured so that it can later connect to an existing NestJS REST API without requiring a major rewrite.
Do not create a static landing page only. Build a real application interface with routing, reusable components, forms, tables, dashboards, role-based navigation, responsive layouts, loading states, empty states, validation states, and realistic mock data.

1. Product and architecture context
EduMovil is an educational technology platform that connects:
Schools.
Colleges.
Institutes.
Administrators.
Data collectors or surveyors.
Teachers.
Students.
Parents.
The current backend is an existing NestJS + Prisma + PostgreSQL project named:
Backend_EduMovil

The backend will expose a REST API consumed by this React application.
The final architecture will be:
React Web App
      ↓ HTTPS REST API
NestJS Backend
      ↓ Prisma
PostgreSQL hosted on Supabase

Important:
React must not connect directly to PostgreSQL.
React must not contain database credentials.
React must not contain JWT secrets.
React must not use Supabase service-role keys.
The backend API will handle authentication, authorization, validation, business rules, and database access.
For this task, use realistic mock data and a clean API abstraction so the real backend can be connected in Task 2.

2. Technology requirements
Use:
React.
TypeScript.
Vite.
React Router.
Tailwind CSS or the existing styling system used by the generated project.
A reusable component architecture.
A centralized API client abstraction.
Responsive design for desktop, tablet, and mobile.
Accessible semantic HTML.
Clear TypeScript types.
Reusable layouts and components.
Do not create a completely different technology stack.
The final project must be exportable as a complete ZIP and runnable locally with the standard commands.
Use a clean structure similar to:
src/
├── api/
├── assets/
├── components/
├── components/ui/
├── layouts/
├── pages/
├── routes/
├── auth/
├── hooks/
├── types/
├── mocks/
├── utils/
├── App.tsx
└── main.tsx

Adapt the structure to the project, but keep the code modular and maintainable.

3. Visual identity
Use the existing EduMovil identity consistently.
Brand name:
Edu·Movil

Logo concept:
Signal Ascent

Visual style:
Futuristic educational technology.
Professional SaaS dashboard.
Modern but not childish.
Clean information hierarchy.
Strong contrast.
Subtle gradients.
Rounded cards.
Clear data visualization.
Premium but practical.
Suitable for schools, colleges, institutes, and administrative personnel.
Use these colors:
Deep Navy:     #0A1628
Electric Blue: #1B6FFF
Vivid Orange:  #FF5C1A
Cyan Accent:   #00C8FF
White:         #FFFFFF

Use Space Grotesk or the closest available equivalent.
Do not create an unrelated color palette.
Use:
Deep navy for the main application shell.
White or very light surfaces for content areas.
Electric blue for primary actions and active states.
Orange for highlights, warnings, achievements, and important actions.
Cyan for secondary accents, metrics, and visual details.
The interface must look like one coherent product across all screens.

4. Application roles
The application has two web roles:
ADMIN
ENCUESTADOR

The login screen must support both roles, but the role will ultimately come from the backend after authentication.
Create role-aware navigation:
ADMIN navigation
Dashboard.
Instituciones educativas.
Gestiones académicas.
Cursos y paralelos.
Profesores.
Materias.
Estudiantes.
Padres y tutores.
Notas.
Prácticas.
Importación masiva.
Usuarios web.
Reportes.
Configuración.
ENCUESTADOR navigation
Dashboard de recolección.
Institución asignada.
Estudiantes.
Cursos y paralelos.
Importación masiva, if permitted.
Registro o actualización de datos.
Perfil.
The UI must not show administrator-only options to an ENCUESTADOR.
For this first task, role switching may use mock authentication or a development selector, but the code must be prepared to receive the real authenticated role from the NestJS API in Task 2.
Do not hardcode the final user role permanently.

5. Required screens
Build the following screens and routes.
Public routes
/login
Create a polished login screen containing:
EduMovil logo.
Brand name.
Short educational platform description.
Code or username field.
Password field.
Show/hide password button.
Remember session option.
Login button.
Loading state.
Invalid credentials state.
Link or text for help.
Responsive layout.
The design should work on:
Desktop.
Tablet.
Mobile.
On desktop, use a two-column composition:
Branding or visual section.
Login form section.
On mobile, collapse into a focused single-column login experience.
Do not include real credentials in the UI.

6. Main application shell
Create a reusable authenticated layout with:
Sidebar navigation on desktop.
Collapsible sidebar.
Mobile drawer navigation.
Top bar.
Current page title.
Breadcrumb or contextual label.
User profile menu.
Current role badge.
Institution context when applicable.
Notifications icon or placeholder.
Theme-consistent buttons.
Responsive content area.
The layout must not overflow horizontally on small screens.
The sidebar should clearly indicate:
Active route.
Role-specific items.
Section groups.
Icons.
Labels.
Collapsed state.
Use a consistent icon library already available in the project or an appropriate icon package.
Do not use random unrelated icons.

7. ADMIN dashboard
Create a complete administrator dashboard with realistic mock data.
Include:
Summary metric cards
Total instituciones.
Total estudiantes.
Total profesores.
Total cursos.
Registros pendientes.
Importaciones recientes.
Each card should include:
Icon.
Main number.
Descriptive label.
Optional trend or supporting text.
Consistent visual accent.
Charts
Include polished charts or chart placeholders for:
Student enrollment by academic management.
Students by educational institution.
Academic performance overview.
Recent registration activity.
Use a chart library if appropriate, but keep charts modular so real API data can replace the mock data later.
Recent activity
Show a table or timeline containing:
Recent student registrations.
Recent imports.
Updated grades.
New web users.
Institution updates.
Quick actions
Include buttons or cards for:
Register student.
Import students.
Create institution.
Create course.
Manage users.
View reports.
The dashboard must look like a real administrative SaaS product, not a collection of empty cards.

8. ENCUESTADOR dashboard
Create a different dashboard for the ENCUESTADOR role.
It must emphasize data collection and assigned work.
Include:
Assigned institution.
Assigned academic management.
Total students registered.
Pending records.
Completed records.
Import status.
Recent activity.
Progress indicator.
Quick action to register a student.
Quick action to import data.
Quick action to review incomplete records.
Do not show administrator-only statistics or controls.
The dashboard should feel simpler and task-oriented while still using the EduMovil visual identity.

9. CRUD pages
Create reusable CRUD page patterns and implement the following pages with realistic mock data.
Institutions
Route:
/admin/instituciones

Include:
Page header.
Search.
Filters.
Create institution button.
Table on desktop.
Responsive cards on mobile.
Institution name.
Type.
City or location.
Status.
Number of students.
Number of courses.
Actions menu.
View.
Edit.
Activate/deactivate.
Academic management periods
Route:
/admin/gestiones

Include:
Academic year.
Status.
Start date.
End date.
Associated institution.
Create/edit form.
Activate/deactivate actions.
Courses and parallels
Route:
/admin/cursos

Include:
Course name.
Parallel.
Academic management.
Institution.
Number of students.
Head teacher.
Status.
Search and filters.
Create/edit form.
View students action.
Do not create a separate Paralelo entity in the frontend. Treat paralelo as a field belonging to a course, consistent with the existing backend model.
Teachers
Route:
/admin/profesores

Include:
CI.
Names.
Last names.
Phone or contact information when available.
Status.
Associated subjects.
Associated institution.
Search.
Create/edit form.
Activate/deactivate.
Subjects
Route:
/admin/materias

Include:
Subject name.
Course.
Teacher.
Institution.
Status.
Create/edit form.
Students
Route:
/admin/estudiantes

Include:
Names.
Last names.
CI.
Birth date.
Course.
Parallel.
Institution.
Academic management.
Status.
Parent/tutor indicator.
Search.
Filters.
Create student form.
Edit student form.
Detail view.
Activate/deactivate.
Import action.
Parents and tutors
Route:
/admin/padres

Include:
Names.
Last names.
CI.
Phone.
Email if available.
Relationship.
Associated students.
Create/edit form.
Detail view.
Grades
Route:
/admin/notas

Include:
Student.
Subject.
Course.
Academic management.
Term or trimester.
Score.
Status.
Search and filters.
Detail or edit interaction.
Summary indicators.
Practices
Route:
/admin/practicas

Include:
Student.
Subject.
Title or description.
Score or result.
Date.
Status.
Search.
Detail view.
Create/edit form.
Reports
Route:
/admin/reportes

Include:
Academic performance summary.
Students by institution.
Students by course.
Registration activity.
Import history.
Filters by institution and academic management.
Export buttons as visual placeholders.
Empty and loading states.
The export buttons may be non-functional in Task 1, but their components should be prepared for future API integration.

10. Web user administration
Create the administrator-only web-user page:
/admin/usuarios

Include:
User list.
Code.
Names.
Email.
Role.
Assigned institution.
Status.
Last access.
Create user.
Edit user.
Activate/deactivate.
Reset password action.
Role selector.
Institution selector.
Confirmation dialogs.
Available roles:
ADMIN
ENCUESTADOR

Do not display password hashes or sensitive authentication data.
The frontend should only send passwords through the secure login or password-management API when connected in Task 2.

11. Importación masiva page
Create the complete visual workflow for importing Excel or CSV data.
Route:
/admin/importacion

And a role-compatible route or shared page for ENCUESTADOR.
The page must include:
Step 1 — Select file
Drag-and-drop area.
Browse file button.
Accepted formats: .xlsx, .xls, .csv.
File name.
File size.
Remove file action.
Upload state.
Step 2 — Preview
Show:
Number of rows.
Detected columns.
Preview table.
Horizontal scrolling only inside the table when necessary.
Empty file state.
Invalid format state.
Step 3 — Column mapping
Allow mapping spreadsheet columns to fields such as:
Nombres.
Apellidos.
CI.
Fecha de nacimiento.
Curso.
Paralelo.
Institución.
Gestión académica.
Parent/tutor fields.
The UI must clearly distinguish:
Required fields.
Optional fields.
Unmapped columns.
Invalid mappings.
Step 4 — Validation
Show:
Valid rows.
Invalid rows.
Duplicate rows.
Warnings.
Row number.
Field.
Error message.
Filter by error type.
Step 5 — Confirmation
Show a summary:
Rows to create.
Rows to update, if supported.
Rows to skip.
Rows with errors.
Institution.
Academic management.
Selected course or mapping context.
Include a clear confirmation button.
Step 6 — Results
Show:
Import completed or failed.
Created records.
Updated records.
Skipped records.
Failed records.
Download error report button.
Start another import button.
For Task 1, the import workflow may use mock processing, but it must be designed so that Task 2 can connect it to the real backend endpoint without rebuilding the interface.
Do not make the import page a simple file input only.

12. Shared form components
Create reusable components for:
Text input.
Password input.
Select.
Multi-select where needed.
Date input.
Search input.
Form field with label.
Validation message.
Modal.
Confirmation dialog.
Toast notification.
Data table.
Pagination.
Status badge.
Empty state.
Loading skeleton.
Error state.
File upload area.
Stepper.
Tabs.
Dropdown menu.
Forms must have:
Labels.
Required indicators.
Validation messages.
Disabled state.
Loading state.
Success feedback.
Error feedback.
Do not duplicate the same form markup unnecessarily across pages.

13. Responsive behavior
The application must be fully responsive.
Desktop
Persistent sidebar.
Multi-column dashboards.
Full data tables.
Side-by-side forms when appropriate.
Charts displayed comfortably.
Tablet
Collapsible sidebar.
Reduced grid columns.
Responsive tables.
Adaptive forms.
Mobile
Mobile navigation drawer.
Single-column layout.
Cards instead of wide tables where appropriate.
Horizontally scrollable data tables only inside bounded containers.
Buttons that wrap properly.
No page-level horizontal overflow.
Forms optimized for touch.
Readable typography.
Bottom or floating action pattern only when useful.
Test the design mentally at approximately:
320px
375px
768px
1024px
1440px


14. API abstraction preparation
Even though Task 1 may use mock data, create a centralized API structure.
Prepare files or modules similar to:
src/api/client.ts
src/api/auth.api.ts
src/api/instituciones.api.ts
src/api/gestiones.api.ts
src/api/cursos.api.ts
src/api/profesores.api.ts
src/api/materias.api.ts
src/api/estudiantes.api.ts
src/api/padres.api.ts
src/api/notas.api.ts
src/api/practicas.api.ts
src/api/usuarios.api.ts
src/api/import.api.ts

Use a configurable API URL:
VITE_API_URL=http://localhost:3000/api/v1

Do not place a real production URL in the code.
The API client should be designed to support:
GET.
POST.
PATCH or PUT.
DELETE when appropriate.
Authorization headers.
JSON requests.
File uploads.
Consistent error handling.
For now, mock services may be used, but keep the API boundary clear.
Do not scatter fetch() calls throughout the UI components.

15. Authentication preparation
Create an authentication abstraction with:
Auth context or equivalent state provider.
Current user state.
Access token state.
Login method.
Logout method.
Role access.
Protected routes.
Redirect to login when unauthenticated.
Redirect to the correct dashboard after login.
The expected backend login contract will conceptually be:
POST /api/v1/auth/web/login

Request:
{
  "codigo": "ADM-001",
  "password": "example-password"
}

Response:
{
  "accessToken": "JWT_TOKEN",
  "user": {
    "id": "uuid",
    "codigo": "ADM-001",
    "nombres": "Administrador",
    "apellidos": "General",
    "email": "admin@example.com",
    "rol": "ADMIN",
    "activo": true,
    "unidadEducativaId": null
  }
}

This is a conceptual contract. Do not invent additional authentication behavior. Task 2 will adapt the client to the final Swagger contract from the backend.
For Task 1, provide a development mock login mode that can simulate:
ADMIN.
ENCUESTADOR.
Invalid credentials.
Loading state.
Clearly isolate mock authentication so it can be removed or disabled when the real API is connected.

16. Data types
Create TypeScript types for the main entities:
UsuarioWeb.
UnidadEducativa.
GestionAcademica.
Curso.
Profesor.
Materia.
Estudiante.
Padre.
Nota.
Practica.
ImportResult.
ImportRowError.
ApiError.
AuthResponse.
Do not use any throughout the project.
Use optional fields only where the backend model allows them.
Keep naming consistent with the backend domain, including:
unidadEducativaId
gestionId
cursoActualId
profesorCi
paralelo
activo
Do not invent a separate Paralelo model.

17. Mock data requirements
Create realistic mock data for:
At least 2 educational institutions.
At least 2 academic management periods.
At least 5 courses.
At least 8 teachers.
At least 10 subjects.
At least 20 students.
Several parents.
Several grades.
Several practices.
At least 2 web users.
Recent activity.
Import history.
Mock data should be coherent across relationships.
For example:
Students must reference existing courses.
Courses must reference existing institutions and academic periods.
Subjects must reference existing teachers or courses where appropriate.
Grades must reference existing students and subjects.
Do not use random unrelated values.

18. UX quality requirements
The application should feel production-oriented.
Include:
Consistent spacing.
Clear hierarchy.
Proper hover states.
Focus states.
Disabled states.
Loading states.
Error states.
Confirmation dialogs for destructive or status-changing actions.
Toast notifications.
Accessible keyboard navigation.
Good empty states.
Clear page titles.
Helpful descriptions.
Responsive modals.
Consistent button hierarchy.
Do not create unnecessary animations. Use subtle transitions only where they improve usability.
Do not fill every space with cards. Use a balanced professional dashboard composition.

19. Important restrictions
Do not:
Create a new backend.
Create a Supabase database connection inside React.
Add PostgreSQL credentials to frontend files.
Add JWT secrets to frontend files.
Use Supabase service-role keys.
Assume exact backend routes without checking the provided conceptual contract.
Replace the future NestJS backend with Supabase direct queries.
Create a separate database for the web app.
Create a separate authentication system that conflicts with NestJS.
Hardcode the final production API URL.
Make the entire application one giant component.
Build only static screenshots without routing and reusable components.

20. Final deliverables
Deliver a complete React project that includes:
All pages.
All routes.
Responsive layouts.
Reusable components.
Mock authentication.
Role-aware navigation.
Mock data.
CRUD interfaces.
Import workflow UI.
API abstraction.
TypeScript types.
Environment example.
README.
Installation instructions.
Development commands.
Explanation of where Task 2 should connect the real backend.
The project must be exportable as a complete ZIP.
The README must explain:
How to install dependencies.
How to run the project.
How to configure VITE_API_URL.
How mock authentication works.
Which routes exist.
Which components are reusable.
Where the real NestJS API integration should be implemented.
Which parts currently use mock data.
How to disable mock mode when the real API is connected.
At the end, provide a concise report containing:
Project structure.
Implemented routes.
Main reusable components.
Authentication preparation.
API abstraction location.
Import workflow location.
Mock data location.
Known limitations.
Exact ZIP filename.

