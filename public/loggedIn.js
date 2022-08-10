// checkIfLoggedIn();

logoutButton.addEventListener('click', () => {
  const loggedIn = localStorage.removeItem('loggedIn');
  
});

getCourses()
.then((courses) => {
  courses.forEach((course) => {
    const courseGenerated = generateFromTemplate(courseTemplate, '.content__courses-article');
    courseGenerated.querySelector('.content__courses-article-headline').textContent = course.name;
    courseGenerated.querySelector('.content__courses-article-para').textContent = `Курс из ${course.length} этапов`;
    courseGenerated.querySelector('.content__courses-article-button').addEventListener('click', (evt) => {
      clickCourseButton(course);
    })
    coursesDiv.append(courseGenerated);
  })
});

