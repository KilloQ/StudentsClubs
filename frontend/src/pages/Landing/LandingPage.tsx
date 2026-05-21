import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Calendar,
    ClipboardCheck,
    Clock,
    Mail,
    MapPin,
    Megaphone,
    Trophy,
    UserCircle,
    Users,
    Dumbbell,
    ExternalLink,
} from "lucide-react";
import LandingHeader from "../../components/LandingHeader/LandingHeader";
import { Button, Logo } from "../../shared/components";
import { useAuth } from "../../contexts/useAuth";
import { Seo } from "../../seo/seo";
import "./LandingPage.css";

const CLUB_EMAIL = "svyazist@mtuci.ru";
const CLUB_VK_URL = "https://vk.com/mssksvyazist";
const CLUB_ADDRESS = "Авиамоторная ул., 8а, 1-й этаж, каб. А-137";
const CLUB_HOURS = "Понедельник – пятница, 9:00 – 22:00";

const clubTopics = [
    {
        icon: Dumbbell,
        title: "Массовый студенческий спорт",
        text: "Главная задача МССК «Связист» — развивать спорт в МТУСИ: чтобы как можно больше студентов занимались, соревновались и были в движении.",
    },
    {
        icon: Trophy,
        title: "Соревнования и мероприятия",
        text: "Клуб организует спортивные состязания и события для студентов университета — от внутренних турниров до участия в общероссийских программах.",
    },
    {
        icon: Calendar,
        title: "Тренировочный процесс",
        text: "Регулярные тренировки по секциям: расписание, место занятий и состав группы — всё, что нужно, чтобы стабильно ходить на спорт.",
    },
    {
        icon: UserCircle,
        title: "Запись в секцию",
        text: "Студенты МТУСИ записываются в спортивную секцию, когда идёт набор и есть свободные места. Можно выбрать одно или несколько направлений.",
    },
    {
        icon: ClipboardCheck,
        title: "Посещаемость на тренировках",
        text: "Учёт присутствия на занятиях — и для спортсмена, и для тренера: видно, как ты посещаешь секцию в течение семестра.",
    },
    {
        icon: Megaphone,
        title: "Новости клуба",
        text: "Набор в секции, переносы тренировок, старты соревнований — актуальное публикуется в ленте и в объявлениях секций.",
    },
];

const joinSteps = [
    {
        num: "01",
        title: "Выбери секцию",
        text: "Посмотри спортивные направления клуба «Связист»: вид спорта, описание, тренер и есть ли сейчас набор.",
    },
    {
        num: "02",
        title: "Запишись",
        text: "Если набор открыт — запишись в секцию. Количество мест ограничено, поэтому за популярные направления лучше не тянуть.",
    },
    {
        num: "03",
        title: "Тренируйся",
        text: "Приходи по расписанию, участвуй в жизни секции и соревнованиях. Новости и изменения — в объявлениях твоей группы.",
    },
];

const participants = [
    {
        tag: "Студентам",
        text: "Записаться в спортивную секцию, смотреть расписание тренировок, посещаемость и новости МССК «Связист».",
        path: "/clubs",
        cta: "Спортивные секции",
    },
    {
        tag: "Тренерам и преподавателям",
        text: "Вести секцию: набор группы, расписание тренировок, отметки на занятиях и объявления для спортсменов.",
        path: "/login",
        cta: "Войти",
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

    const profilePath =
        user?.role === "admin"
            ? "/account/admin"
            : user?.is_teacher
              ? "/account/teacher"
              : "/account/profile";
    const canonicalUrl = siteUrl ? `${siteUrl}/` : undefined;

    return (
        <>
            <Seo
                title="МССК «Связист» — спортивный клуб МТУСИ"
                description="Многопрофильный студенческий спортивный клуб МТУСИ «Связист»: секции, тренировки, соревнования и запись для студентов."
                canonicalUrl={canonicalUrl}
                openGraph={{
                    title: "ССК Связист | Спортивный клуб МТУСИ",
                    description: "Массовый студенческий спорт, тренировки и соревнования. Запись в спортивные секции.",
                    url: canonicalUrl,
                    type: "website",
                }}
            />
            <LandingHeader />

            <main className="landing">
                <section className="landing-hero" aria-labelledby="hero-title">
                    <div className="landing-hero-bg" aria-hidden />
                    <div className="landing-hero-inner">
                        <p className="landing-eyebrow">ССК Связист · Спортивный клуб МТУСИ</p>
                        <h1 id="hero-title" className="landing-hero-title">
                            <span>МССК «Связист»</span>
                        </h1>
                        <p className="landing-hero-tagline">
                            Многопрофильный студенческий спортивный клуб Московского технического университета связи и информатики
                        </p>
                        <p className="landing-hero-lead">
                            Официальное сообщество спортклуба МТУСИ. Клуб развивает массовый студенческий спорт: организует
                            соревнования и мероприятия, выстраивает тренировочный процесс по секциям. Студенты записываются в
                            направления, тренеры ведут группы.
                        </p>
                        <div className="landing-hero-actions">
                            <Button variant="primary" size="lg" icon={<ArrowRight size={18} aria-hidden />} onClick={() => navigate("/clubs")}>
                                Секции с набором
                            </Button>
                            {!isAuthenticated && (
                                <Button variant="ghost" size="lg" onClick={() => navigate("/register")}>
                                    Регистрация
                                </Button>
                            )}
                        </div>
                        <dl className="landing-stats" aria-label="Направления работы клуба">
                            <div>
                                <dt>Соревнования</dt>
                                <dd>и мероприятия</dd>
                            </div>
                            <div>
                                <dt>Тренировки</dt>
                                <dd>по секциям</dd>
                            </div>
                            <div>
                                <dt>Набор</dt>
                                <dd>в секции</dd>
                            </div>
                            <div>
                                <dt>Участники</dt>
                                <dd>студенты МТУСИ</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <section className="landing-section landing-section-student" id="about-club" aria-labelledby="club-title">
                    <div className="landing-section-inner">
                        <p className="landing-section-label">О клубе</p>
                        <h2 id="club-title" className="landing-section-title">
                            Массовый спорт, тренировки и соревнования
                        </h2>
                        <p className="landing-section-lead landing-section-lead-wide">
                            МССК «Связист» — это студенческий спортивный клуб университета, а не разрозненные объявления в чатах.
                            Здесь собраны спортивные секции: у каждой — своё направление, тренировки и набор участников. Клуб входит
                            в Ассоциацию студенческих спортивных клубов России и работает на развитие #СпортМТУСИ и жизни
                            #сскСВЯЗИСТ.
                        </p>
                        <ul className="landing-student-benefits">
                            {clubTopics.map(({ icon: Icon, title, text }) => (
                                <li key={title} className="landing-student-benefit">
                                    <span className="landing-feature-icon" aria-hidden>
                                        <Icon size={22} />
                                    </span>
                                    <div>
                                        <h3>{title}</h3>
                                        <p>{text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="landing-student-cta-bar">
                            <p>Хочешь заниматься спортом в МТУСИ? Смотри, в какие секции «Связист» сейчас идёт набор.</p>
                            <Button variant="primary" icon={<ArrowRight size={18} aria-hidden />} onClick={() => navigate("/clubs")}>
                                Все спортивные секции
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="landing-section landing-section-alt" id="how" aria-labelledby="how-title">
                    <div className="landing-section-inner">
                        <p className="landing-section-label">Как начать заниматься</p>
                        <h2 id="how-title" className="landing-section-title">
                            От выбора секции до первой тренировки
                        </h2>
                        <p className="landing-section-lead">
                            Студент выбирает направление, записывается при открытом наборе и выходит на тренировки по расписанию секции.
                        </p>
                        <ol className="landing-steps">
                            {joinSteps.map((step) => (
                                <li key={step.num}>
                                    <span className="landing-step-num">{step.num}</span>
                                    <h3>{step.title}</h3>
                                    <p>{step.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section className="landing-section landing-section-compact" id="who" aria-labelledby="who-title">
                    <div className="landing-section-inner">
                        <h2 id="who-title" className="landing-section-title landing-section-title-sm">
                            Кто участвует в клубе
                        </h2>
                        <p className="landing-section-lead">
                            В основе «Связист» — студенты на тренировках и тренеры, которые ведут секции. Запись, расписание и
                            новости собраны здесь, чтобы про спорт в МТУСИ было проще узнать и присоединиться.
                        </p>
                        <div className="landing-staff-notes">
                            {participants.map((item) => {
                                const actionPath =
                                    isAuthenticated && item.path === "/login" ? profilePath : item.path;
                                const actionCta =
                                    isAuthenticated && item.path === "/login" ? "Профиль" : item.cta;

                                return (
                                    <article key={item.tag} className="landing-staff-card">
                                        <span className="landing-staff-tag">{item.tag}</span>
                                        <p>{item.text}</p>
                                        <Button
                                            variant="link"
                                            icon={<ArrowRight size={14} aria-hidden />}
                                            onClick={() => navigate(actionPath)}
                                        >
                                            {actionCta}
                                        </Button>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="landing-section landing-contact" id="contact" aria-labelledby="contact-title">
                    <div className="landing-section-inner">
                        <h2 id="contact-title" className="landing-section-title landing-section-title-sm">
                            Контакты спортклуба
                        </h2>
                        <p className="landing-section-lead">
                            Многопрофильный студенческий спортивный клуб МТУСИ «Связист»
                        </p>
                        <ul className="landing-contact-list">
                            <li>
                                <MapPin size={20} aria-hidden />
                                <div>
                                    <strong>Адрес</strong>
                                    <span>{CLUB_ADDRESS}</span>
                                </div>
                            </li>
                            <li>
                                <Mail size={20} aria-hidden />
                                <div>
                                    <strong>Email</strong>
                                    <a href={`mailto:${CLUB_EMAIL}`}>{CLUB_EMAIL}</a>
                                </div>
                            </li>
                            <li>
                                <ExternalLink size={20} aria-hidden />
                                <div>
                                    <strong>ВКонтакте</strong>
                                    <a href={CLUB_VK_URL} target="_blank" rel="noopener noreferrer">
                                        vk.com/mssksvyazist
                                    </a>
                                </div>
                            </li>
                            <li>
                                <Clock size={20} aria-hidden />
                                <div>
                                    <strong>Часы работы спортклуба</strong>
                                    <span>{CLUB_HOURS}</span>
                                </div>
                            </li>
                        </ul>
                        <p className="landing-contact-note">
                            <Users size={16} aria-hidden />
                            Состоим в Ассоциации студенческих спортивных клубов России
                        </p>
                        <p className="landing-hashtags">
                            <span>#СпортМТУСИ</span>
                            <span>#сскСВЯЗИСТ</span>
                        </p>
                    </div>
                </section>

                <section className="landing-cta" aria-labelledby="cta-title">
                    <div className="landing-cta-inner">
                        <h2 id="cta-title">Присоединяйся к «Связист»</h2>
                        <p>
                            Студенты МТУСИ записываются в спортивные секции с открытым набором. Выбери направление и выходи на
                            тренировки — массовый спорт начинается с одной секции.
                        </p>
                        <div className="landing-hero-actions">
                            <Button variant="primary" size="lg" onClick={() => navigate("/clubs")}>
                                Смотреть секции
                            </Button>
                            {!isAuthenticated && (
                                <Button variant="ghost" size="lg" onClick={() => navigate("/register")}>
                                    Регистрация
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="landing-footer">
                    <div className="landing-footer-inner">
                        <Logo tone="footer" className="landing-footer-brand" />
                        <nav className="landing-footer-nav" aria-label="Навигация в подвале">
                            <Button variant="footer" onClick={() => navigate("/clubs")}>
                                Секции
                            </Button>
                            <Button variant="footer" onClick={() => navigate("/news")}>
                                Новости
                            </Button>
                            <a
                                className="landing-footer-link"
                                href={CLUB_VK_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ВКонтакте
                            </a>
                            {!isAuthenticated && (
                                <>
                                    <Button variant="footer" onClick={() => navigate("/login")}>
                                        Вход
                                    </Button>
                                    <Button variant="footer" onClick={() => navigate("/register")}>
                                        Регистрация
                                    </Button>
                                </>
                            )}
                        </nav>
                        <p className="landing-footer-copy">
                            МССК «Связист» · Спортивный клуб МТУСИ · {new Date().getFullYear()}
                        </p>
                    </div>
                </footer>
            </main>
        </>
    );
}
