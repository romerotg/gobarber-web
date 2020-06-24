import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { isToday, format, isAfter } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import DayPicker, { DayModifiers } from 'react-day-picker';
import 'react-day-picker/lib/style.css';

import { FiPower, FiClock } from 'react-icons/fi';
import { parseISO } from 'date-fns/esm';
import { Link } from 'react-router-dom';
import {
  Container,
  Header,
  HeaderContent,
  Profile,
  Content,
  Schedule,
  NextAppointment,
  Section,
  Appointment,
  Calendar,
} from './styles';

import logoImg from '../../assets/logo.svg';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';

interface MonthAvailabilityItem {
  day: number;
  available: boolean;
}

interface Appointment {
  id: string;
  date: string;
  formattedHour: string;
  user: {
    name: string;
    avatar_url: string;
  };
}

const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthAvailability, setMonthAvailability] = useState<
    MonthAvailabilityItem[]
  >([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const handleDateChange = useCallback((day: Date, modifiers: DayModifiers) => {
    if (modifiers.available && !modifiers.disabled) {
      setSelectedDate(day);
    }
  }, []);

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
  }, []);

  useEffect(() => {
    api
      .get(`/providers/${user.id}/month-availability`, {
        params: {
          year: currentMonth.getFullYear(),
          month: currentMonth.getMonth() + 1,
        },
      })
      .then(response => {
        setMonthAvailability(response.data);
      });
  }, [currentMonth, user.id]);

  useEffect(() => {
    api
      .get<Appointment[]>('/appointments/schedule', {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        },
      })
      .then(response => {
        const formattedAppointments = response.data.map(appointment => {
          return {
            ...appointment,
            formattedHour: format(parseISO(appointment.date), 'HH:mm'),
          };
        });
        setAppointments(formattedAppointments);
      });
  }, [selectedDate]);

  const disabledDays = useMemo(() => {
    const dates = monthAvailability
      .filter(monthDay => monthDay.available === false)
      .map(monthDay => {
        return new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          monthDay.day,
        );
      });

    return dates;
  }, [currentMonth, monthAvailability]);

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "'Dia' dd 'de' MMMM", {
      locale: ptBR,
    });
  }, [selectedDate]);

  const selectedWeekDayAsText = useMemo(() => {
    return format(selectedDate, 'cccc', {
      locale: ptBR,
    });
  }, [selectedDate]);

  const morningAppointments = useMemo(() => {
    const morning = appointments.filter(appointment => {
      return parseISO(appointment.date).getHours() < 12;
    });

    if (morning.length === 0) {
      return <p>Nenhum agendamento neste período</p>;
    }

    return morning.map(appointment => (
      <Appointment key={appointment.id}>
        <span>
          <FiClock />
          {appointment.formattedHour}
        </span>

        <div>
          <img src={appointment.user.avatar_url} alt={appointment.user.name} />

          <strong>{appointment.user.name}</strong>
        </div>
      </Appointment>
    ));
  }, [appointments]);

  const afternoonAppointments = useMemo(() => {
    const afternoon = appointments.filter(appointment => {
      return parseISO(appointment.date).getHours() >= 12;
    });

    if (afternoon.length === 0) {
      return <p>Nenhum agendamento neste período</p>;
    }

    return afternoon.map(appointment => (
      <Appointment key={appointment.id}>
        <span>
          <FiClock />
          {appointment.formattedHour}
        </span>

        <div>
          <img src={appointment.user.avatar_url} alt={appointment.user.name} />

          <strong>{appointment.user.name}</strong>
        </div>
      </Appointment>
    ));
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    if (!isToday(selectedDate)) {
      return null;
    }

    const next = appointments.find(appointment =>
      isAfter(parseISO(appointment.date), new Date()),
    );

    if (!next) {
      return null;
    }

    return (
      <NextAppointment>
        <strong>Agendamento a seguir</strong>

        <div>
          <img src={next.user.avatar_url} alt={next.user.name} />

          <strong>{next.user.name}</strong>
          <span>
            <FiClock />
            {next.formattedHour}
          </span>
        </div>
      </NextAppointment>
    );
  }, [selectedDate, appointments]);

  return (
    <Container>
      <Header>
        <HeaderContent>
          <img src={logoImg} alt="GoBarber" />

          <Profile>
            <img src={user.avatar_url} alt={user.name} />

            <div>
              <span>Bem vindo, </span>
              <Link to="/profile">
                <strong>{user.name}</strong>
              </Link>
            </div>
          </Profile>

          <button type="button" onClick={signOut}>
            <FiPower />
          </button>
        </HeaderContent>
      </Header>

      <Content>
        <Schedule>
          <h1>Horários agendados</h1>
          <p>
            {isToday(selectedDate) && <span>Hoje</span>}
            <span>{selectedDateAsText}</span>
            <span>{selectedWeekDayAsText}</span>
          </p>

          {isToday(selectedDate) && nextAppointment}

          <Section>
            <strong>Manhã</strong>

            {morningAppointments}
          </Section>

          <Section>
            <strong>Tarde</strong>

            {afternoonAppointments}
          </Section>
        </Schedule>
        <Calendar>
          <DayPicker
            weekdaysShort={['D', 'S', 'T', 'Q', 'Q', 'S', 'S']}
            fromMonth={new Date()}
            disabledDays={[{ daysOfWeek: [0, 6] }, ...disabledDays]}
            modifiers={{
              available: { daysOfWeek: [1, 2, 3, 4, 5] },
            }}
            selectedDays={selectedDate}
            onMonthChange={handleMonthChange}
            onDayClick={handleDateChange}
            months={[
              'Janeiro',
              'Fevereiro',
              'Março',
              'Abril',
              'Maio',
              'Junho',
              'Julho',
              'Agosto',
              'Setembro',
              'Outubro',
              'Novembro',
              'Dezembro',
            ]}
          />
        </Calendar>
      </Content>
    </Container>
  );
};

export default Dashboard;
