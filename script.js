const formSearch = document.querySelector('.form-search'),
	inputCitiesForm = formSearch.querySelector('.input__cities-from'),
	dropdownCitiesForm = formSearch.querySelector('.dropdown__cities-from'),
	inputCitiesTo = formSearch.querySelector('.input__cities-to'),
	dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
	inputDateDepart = formSearch.querySelector('.input__date-depart'),
	cheapestTicket = document.getElementById('cheapest-ticket'),
	otherCheapTickets = document.getElementById('other-cheap-tickets');

const citiesApi = 'http://api.travelpayouts.com/data/ru/cities.json',
	proxy = 'https://cors-anywhere.herokuapp.com/',
	API_KEY = '1d1518c14d7dfadf96b547fd798645bb',
	calendar = 'http://min-prices.aviasales.ru/calendar_preload',
	MAX_COUNT = 10;

let city = [];

// function
const getData = (url, callback, errorFunc = console.error) => {
	const request = new XMLHttpRequest();

	request.open('GET', url);
	request.addEventListener('readystatechange', () => {
		if (request.readyState !== 4) return;

		if (request.status === 200) {
			callback(request.response);
		} else {
			errorFunc(request.status);
		}
	});

	request.send();
};

const showCity = (input, list) => {
	list.textContent = '';

	if (input.value !== '' ) {
		const filterCity = city.filter((item) => {
			const fixItem = item.name.toLowerCase();

			return fixItem.startsWith(input.value.toLowerCase());
		});

		filterCity.forEach((item) => {
		   const li = document.createElement('li');

		   li.classList.add('dropdown__city');
		   li.textContent = item.name;
		   list.append(li);
		});
	}
};

const handlerCity = (event, input, list) => {
	const target = event.target;

	if (target.tagName.toLowerCase() === 'li') {
		input.value = target.textContent;
		list.textContent = '';
	}
};

const getChanges = (num) => {
	if (num) {
		return num === 1 ? 'С одной пересадкой' : 'С двумя пересадками';
	} else {
		return 'Без пересадок';
	}
};

const getNameCity = (code) => {
	const objCity = city.find( item => item.code === code );
	return objCity.name;
};

const getDate = (date) => {
	return new Date(date).toLocaleString('ru', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

const getLinkAviasales = (data) => {
	let link = 'https://www.aviasales.ru/search/';

	link += data.origin;

	const date = new Date(data.depart_date);

	const day = date.getDate();

	link += day < 10 ? '0' + day : day;

	const month = date.getMonth() + 1;

	link += month < 10 ? '0' + month : month;

	link += data.destination;
	// + 1 это 1 пассажир
	return link + '1';
};

const createCard = (data) => {
	console.log(data);

	const ticket = document.createElement('article');
	ticket.classList.add('ticket');

	let deep = '';

	if (data) {
		deep = `
			<h3 class="agent">${data.gate}</h3>
			<div class="ticket__wrapper">
				<div class="left-side">
					<a href="${getLinkAviasales(data)}" target="_blank" class="button button__buy">Купить
						за ${data.value}₽</a>
				</div>
				<div class="right-side">
					<div class="block-left">
						<div class="city__from">Вылет из города
							<span class="city__name">${getNameCity(data.origin)}</span>
						</div>
						<div class="date">${getDate(data.depart_date)}</div>
					</div>

					<div class="block-right">
						<div class="changes">${getChanges(data.number_of_changes)}</div>
						<div class="city__to">Город назначения:
							<span class="city__name">${getNameCity(data.destination)}</span>
						</div>
					</div>
				</div>
			</div>
		`;
	} else {
		deep = '<h3>На эту дату билетов нет.</h3>'
	}

	ticket.insertAdjacentHTML('afterbegin', deep);

	return ticket;
};

const renderCheapYear = (cheapTickets) => {
	otherCheapTickets.innerHTMML = '<h2>Самые дешевые билеты на другие даты</h2>';

	cheapTickets.sort((a, b) => {
		if (a.value > b.value) {
			return 1;
		}
		if (a.value < b.value) {
			return -1;
		}
		return 0;
	});

	for (let i = 0; i < cheapTickets.length && i < MAX_COUNT; i++) {
		const ticket = createCard(cheapTickets[i]);
		otherCheapTickets.append(ticket);
	}

	console.log(cheapTickets);
};

const renderCheapDate = (cheapTicket) => {
	cheapestTicket.innerHTMML = '<h2>Самый дешевый билет на выбранную дату</h2>';

	const ticket = createCard(cheapTicket[0]);
	cheapestTicket.append(ticket);
};

const renderCheap = (data, date) => {
	const cheapTicketYear = JSON.parse(data).best_prices;
	// дешевые билеты за день
	const cheapTicketDate = cheapTicketYear.filter((item) => {
		return item.depart_date === date;
	});

	renderCheapDate(cheapTicketDate);
	renderCheapYear(cheapTicketYear);
};

inputCitiesForm.addEventListener('input', () => {
	showCity(inputCitiesForm, dropdownCitiesForm);
});

inputCitiesTo.addEventListener('input', () => {
	showCity(inputCitiesTo, dropdownCitiesTo);
});

dropdownCitiesForm.addEventListener('click', (event) => {
	handlerCity(event, inputCitiesForm, dropdownCitiesForm);
});

dropdownCitiesTo.addEventListener('click', (event) => {
	handlerCity(event, inputCitiesTo, dropdownCitiesTo);
});

formSearch.addEventListener('submit', (event) => {
	event.preventDefault();

	const cityFrom = city.find((item) => inputCitiesForm.value === item.name);
	const cityTo = city.find((item) => inputCitiesTo.value === item.name);

	const formData = {
		from: cityFrom,
		to: cityTo,
		when: inputDateDepart.value,
	};

	if (formData.from && formData.to) {
		const requestData = `?depart_date=${formData.when}&origin=${formData.from.code}` +
			`&destination=${formData.to.code}&one_way=true&token=${API_KEY}`;

		getData(calendar + requestData, (response) => {
			renderCheap(response, formData.when);
		}, (e) => {
			alert('В этом направлении нет рейсов.');
			console.log('Ошибка', e);
		});
	} else {
		alert('Введите город!');
	}
});

// вызов функции
getData(proxy + citiesApi, (data) => {
	city = JSON.parse(data).filter((item) => {
		return item.name;
	});

	city.sort((a, b) => {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}
		return 0;
	});
});
