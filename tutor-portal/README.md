# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

how about we change the db json first....can't we do separate classes..ttutors,student etc...and then we fetch them byt id...like we store each with corresponding id...like classes with tutor id...then student with class id...and of course other details....like to get students of a class we just do

{
  "tutors": [
    {
      "id": "1",
      "username": "tutor1",
      "password": "password123",
      "email": "tutor1@example.com",
      "name": "Tutor One"
    },
    {
      "id": "2",
      "username": "tutor2",
      "password": "securepass",
      "email": "tutor2@example.com",
      "name": "Tutor Two"
    }
  ],
  "students": [
    {
      "id": "1",
      "username": "student1",
      "password": "mypassword",
      "email": "student1@example.com",
      "name": "Student One",
      "classId": "1"
    },
    {
      "id": "2",
      "username": "student2",
      "password": "studentpass",
      "email": "student2@example.com",
      "name": "Student Two",
      "classId": "2"
    }
  ],
  "classes": [
    {
      "id": "1",
      "name": "CSE S6",
      "tutorId": "1",
      "studentsCount": 77,
      "students": [
        {
          "id": "1",
          "name": "Anand",
          "rollNumber": "1",
          "cgpa": "8",
          "gender": "Male"
        },
        {
          "id": "2",
          "name": "Raj",
          "rollNumber": "2",
          "cgpa": "9.5",
          "gender": "Male"
        }
      ],
      "archived": false
    },
    {
      "id": "2",
      "name": "CSE S4",
      "tutorId": "2",
      "studentsCount": 35,
      "archived": false
    }
  ]
}
