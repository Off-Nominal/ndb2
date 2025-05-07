SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: prediction_driver; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prediction_driver AS ENUM (
    'event',
    'date'
);


--
-- Name: prediction_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prediction_status AS ENUM (
    'open',
    'checking',
    'retired',
    'closed',
    'successful',
    'failed'
);


--
-- Name: CAST (public.prediction_driver AS text); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.prediction_driver AS text) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.prediction_status AS text); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.prediction_status AS text) WITH INOUT AS IMPLICIT;


--
-- Name: calc_payout_ratio(integer, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calc_payout_ratio(w integer, s numeric, f text, OUT result numeric) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
BEGIN
  EXECUTE 'SELECT ' || f
  INTO result
  USING $1, $2, $3;
END
$_$;


--
-- Name: refresh_last_checked_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_last_checked_date() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE predictions p
      SET last_check_date = (
        SELECT
          MAX(check_date)
        FROM snooze_checks
        WHERE prediction_id = NEW.prediction_id
      )
      WHERE p.id = NEW.prediction_id;
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_payouts_from_prediction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_payouts_from_prediction() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE bets b
      SET
        payout =
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    b.wager *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END),
        season_payout =
          (CASE
            WHEN p.season_applicable IS FALSE THEN NULL
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    LEAST(b.wager, s.wager_cap) *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END)
      FROM predictions p
      JOIN seasons s ON p.season_id = s.id
      WHERE p.id = b.prediction_id AND p.id = NEW.id;
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_payouts_from_season(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_payouts_from_season() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE bets b
      SET
        payout =
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    b.wager *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END),
        season_payout =
          (CASE
            WHEN p.season_applicable IS FALSE THEN NULL
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    LEAST(b.wager, s.wager_cap) *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END)
      FROM predictions p
      JOIN seasons s ON p.season_id = s.id
      WHERE p.id = b.prediction_id AND p.season_id = NEW.id;
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_prediction_ratios_from_bet(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_prediction_ratios_from_bet() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    WITH recent_season_payout_formula AS (
      SELECT payout_formula
      FROM seasons
      ORDER BY start DESC
      LIMIT 1
    )
    UPDATE predictions p
      SET endorse_ratio = (SELECT
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
                  ), 0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = p.season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        ),
      undorse_ratio = (SELECT
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE)
                FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS FALSE AND b.valid IS TRUE)
                    FROM bets b
                  ),
                  0
                ),
                0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        )
      WHERE p.id = NEW.prediction_id;
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_prediction_ratios_from_prediction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_prediction_ratios_from_prediction() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    WITH recent_season_payout_formula AS (
      SELECT payout_formula
      FROM seasons
      ORDER BY start DESC
      LIMIT 1
    )
    UPDATE predictions p
      SET endorse_ratio = (SELECT
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
                  ), 0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = p.season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        ),
      undorse_ratio = (SELECT
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE)
                FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS FALSE AND b.valid IS TRUE)
                    FROM bets b
                  ),
                  0
                ),
                0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        )
      WHERE p.id = NEW.id AND (SELECT count(*) FROM bets WHERE bets.prediction_id = NEW.id) > 0;
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_prediction_ratios_from_season(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_prediction_ratios_from_season() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    WITH recent_season_payout_formula AS (
      SELECT payout_formula
      FROM seasons
      ORDER BY start DESC
      LIMIT 1
    )
    UPDATE predictions p
      SET endorse_ratio = (SELECT
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
                  ), 0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = p.season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        ),
      undorse_ratio = (SELECT
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE)
                FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS FALSE AND b.valid IS TRUE)
                    FROM bets b
                  ),
                  0
                ),
                0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        )
      WHERE p.season_id = NEW.id;
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_prediction_season_applicable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_prediction_season_applicable() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE predictions p
      SET season_applicable = COALESCE((SELECT NOT closed FROM seasons s WHERE s.id = NEW.season_id), true)
      WHERE p.id = NEW.id;
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_prediction_seasons(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_prediction_seasons() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE predictions p
      SET season_id =
        (SELECT id
          FROM seasons s
          WHERE COALESCE(p.closed_date, p.due_date, p.check_date) > s.start
            AND COALESCE(p.closed_date, p.due_date, p.check_date) <= s.end
        )
      WHERE (TG_ARGV[0] = 'all') OR (TG_ARGV[0] = 'prediction' AND p.id = NEW.id);
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_prediction_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_prediction_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE predictions
      SET status =
        (CASE
          WHEN new.retired_date IS NOT NULL THEN 'retired'::prediction_status
          WHEN new.judged_date IS NOT NULL THEN
            CASE
              WHEN
                (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = new.id)
                  THEN 'successful'::prediction_status
              ELSE 'failed'::prediction_status
            END
          WHEN new.closed_date IS NOT NULL THEN 'closed'::prediction_status
          ELSE
            CASE
              WHEN
                (SELECT EXISTS
                  (SELECT 1 FROM snooze_checks WHERE prediction_id = new.id AND closed = false)
                )
                THEN 'checking'::prediction_status
              ELSE 'open'::prediction_status
            END
        END)
      WHERE predictions.id = new.id;
    RETURN new;
  END;
$$;


--
-- Name: refresh_valid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_valid() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE bets b
      SET valid = COALESCE(b.date < p.closed_date, TRUE)
      FROM predictions p
      WHERE p.id = b.prediction_id AND ((TG_ARGV[0] = 'bet' AND b.id = NEW.id) OR (TG_ARGV[0] = 'prediction' AND b.prediction_id = new.id));
    RETURN new;
  END;
$$;


--
-- Name: refresh_wager(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_wager() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE bets b
      SET wager =
        (SELECT
          COALESCE(
            NULLIF(
              EXTRACT(
                DAY FROM
                  COALESCE(p.closed_date, p.due_date, p.check_date) - b.date
              ),
              0
            ),
            1
          )
        )::INT
      FROM predictions p
      WHERE p.id = b.prediction_id AND ((TG_ARGV[0] = 'bet' AND b.id = NEW.id) OR (TG_ARGV[0] = 'prediction' AND p.id = NEW.id));
    RETURN NEW;
  END;
$$;


--
-- Name: refresh_wager_cap(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_wager_cap() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    UPDATE seasons s
      SET wager_cap =
        EXTRACT(
          DAY FROM
            "end" - start
        )
      WHERE s.id = NEW.id;
    RETURN NEW;
  END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bets (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    prediction_id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    endorsed boolean NOT NULL,
    wager integer DEFAULT 0 NOT NULL,
    valid boolean DEFAULT true NOT NULL,
    payout integer,
    season_payout integer
);


--
-- Name: bets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bets_id_seq OWNED BY public.bets.id;


--
-- Name: predictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.predictions (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    text text NOT NULL,
    created_date timestamp with time zone NOT NULL,
    due_date timestamp with time zone,
    closed_date timestamp with time zone,
    judged_date timestamp with time zone,
    retired_date timestamp with time zone,
    triggered_date timestamp with time zone,
    triggerer_id uuid,
    status public.prediction_status DEFAULT 'open'::public.prediction_status NOT NULL,
    season_id integer,
    endorse_ratio numeric DEFAULT 1 NOT NULL,
    undorse_ratio numeric DEFAULT 1 NOT NULL,
    season_applicable boolean DEFAULT true NOT NULL,
    driver public.prediction_driver DEFAULT 'date'::public.prediction_driver NOT NULL,
    check_date timestamp with time zone,
    last_check_date timestamp with time zone,
    CONSTRAINT predictions_driver_check CHECK (((driver)::text = ANY (ARRAY['event'::text, 'date'::text])))
);


--
-- Name: votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.votes (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    prediction_id integer NOT NULL,
    vote boolean NOT NULL,
    voted_date timestamp with time zone NOT NULL
);


--
-- Name: enhanced_votes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.enhanced_votes AS
 SELECT v.id,
    v.vote,
    v.voted_date,
    v.prediction_id,
    v.user_id AS voter_id,
    p.status,
    p.season_id,
    ( SELECT
                CASE
                    WHEN ((p.status)::text = 'successful'::text) THEN (v.vote IS TRUE)
                    WHEN ((p.status)::text = 'failed'::text) THEN (v.vote IS FALSE)
                    ELSE NULL::boolean
                END AS "case") AS popular_vote
   FROM (public.votes v
     JOIN public.predictions p ON ((p.id = v.prediction_id)));


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.predictions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: predictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.predictions_id_seq OWNED BY public.predictions.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: seasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seasons (
    id integer NOT NULL,
    name text NOT NULL,
    start timestamp with time zone NOT NULL,
    "end" timestamp with time zone NOT NULL,
    payout_formula text NOT NULL,
    wager_cap integer DEFAULT 90 NOT NULL,
    closed boolean DEFAULT false NOT NULL
);


--
-- Name: seasons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seasons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seasons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seasons_id_seq OWNED BY public.seasons.id;


--
-- Name: snooze_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.snooze_checks (
    id integer NOT NULL,
    prediction_id integer,
    check_date timestamp with time zone DEFAULT now() NOT NULL,
    closed boolean DEFAULT false NOT NULL,
    closed_at timestamp with time zone
);


--
-- Name: snooze_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.snooze_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: snooze_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.snooze_checks_id_seq OWNED BY public.snooze_checks.id;


--
-- Name: snooze_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.snooze_votes (
    snooze_check_id integer NOT NULL,
    user_id uuid NOT NULL,
    value smallint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT snooze_votes_value_check CHECK ((value = ANY (ARRAY[1, 7, 30, 90, 365])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    discord_id character varying NOT NULL
);


--
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- Name: bets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets ALTER COLUMN id SET DEFAULT nextval('public.bets_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: predictions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predictions ALTER COLUMN id SET DEFAULT nextval('public.predictions_id_seq'::regclass);


--
-- Name: seasons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seasons ALTER COLUMN id SET DEFAULT nextval('public.seasons_id_seq'::regclass);


--
-- Name: snooze_checks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.snooze_checks ALTER COLUMN id SET DEFAULT nextval('public.snooze_checks_id_seq'::regclass);


--
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- Name: bets bets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_pkey PRIMARY KEY (id);


--
-- Name: bets bets_user_id_prediction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_user_id_prediction_id_key UNIQUE (user_id, prediction_id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: predictions predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seasons seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_pkey PRIMARY KEY (id);


--
-- Name: snooze_checks snooze_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.snooze_checks
    ADD CONSTRAINT snooze_checks_pkey PRIMARY KEY (id);


--
-- Name: snooze_votes snooze_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.snooze_votes
    ADD CONSTRAINT snooze_votes_pkey PRIMARY KEY (snooze_check_id, user_id);


--
-- Name: users users_discord_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_discord_id_key UNIQUE (discord_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: votes votes_user_id_prediction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_user_id_prediction_id_key UNIQUE (user_id, prediction_id);


--
-- Name: bets_prediction_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bets_prediction_id_idx ON public.bets USING btree (prediction_id);


--
-- Name: predictions bet_payout_update_from_prediction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bet_payout_update_from_prediction AFTER UPDATE OF status, endorse_ratio, undorse_ratio ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.refresh_payouts_from_prediction();


--
-- Name: seasons bet_payout_update_from_season; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bet_payout_update_from_season AFTER UPDATE OF payout_formula, wager_cap ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.refresh_payouts_from_season();


--
-- Name: bets bet_valid_update_from_bet; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bet_valid_update_from_bet AFTER UPDATE OF date ON public.bets FOR EACH ROW EXECUTE FUNCTION public.refresh_valid('bet');


--
-- Name: predictions bet_valid_update_from_prediction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bet_valid_update_from_prediction AFTER UPDATE OF closed_date ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.refresh_valid('prediction');


--
-- Name: bets bet_wager_update_from_bet; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bet_wager_update_from_bet AFTER INSERT ON public.bets FOR EACH ROW EXECUTE FUNCTION public.refresh_wager('bet');


--
-- Name: predictions bet_wager_update_from_prediction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bet_wager_update_from_prediction AFTER UPDATE OF due_date, closed_date, check_date ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.refresh_wager('prediction');


--
-- Name: snooze_checks prediction_last_check_date_from_snooze_checks; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_last_check_date_from_snooze_checks AFTER INSERT ON public.snooze_checks FOR EACH ROW EXECUTE FUNCTION public.refresh_last_checked_date();


--
-- Name: bets prediction_payout_ratio_from_bet; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_payout_ratio_from_bet AFTER UPDATE OF valid, endorsed, wager ON public.bets FOR EACH ROW EXECUTE FUNCTION public.refresh_prediction_ratios_from_bet();


--
-- Name: predictions prediction_payout_ratio_from_prediction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_payout_ratio_from_prediction AFTER UPDATE OF season_id ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.refresh_prediction_ratios_from_prediction();


--
-- Name: seasons prediction_payout_ratio_from_seasons; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_payout_ratio_from_seasons AFTER UPDATE OF payout_formula ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.refresh_prediction_ratios_from_season();


--
-- Name: predictions prediction_season_applicable_update_from_predictions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_season_applicable_update_from_predictions AFTER UPDATE OF season_id ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.refresh_prediction_season_applicable();


--
-- Name: predictions prediction_season_update_from_prediction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_season_update_from_prediction AFTER INSERT OR UPDATE OF closed_date, due_date, check_date ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.refresh_prediction_seasons('prediction');


--
-- Name: seasons prediction_season_update_from_season; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_season_update_from_season AFTER INSERT OR DELETE OR UPDATE OF start, "end" ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.refresh_prediction_seasons('all');


--
-- Name: predictions prediction_status_update_from_prediction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prediction_status_update_from_prediction AFTER INSERT OR UPDATE OF retired_date, closed_date, judged_date, check_date, last_check_date ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.refresh_prediction_status();


--
-- Name: seasons season_wager_cap_update_from_season; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER season_wager_cap_update_from_season AFTER INSERT OR UPDATE OF start, "end" ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.refresh_wager_cap();


--
-- Name: bets bets_prediction_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_prediction_id_fk FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;


--
-- Name: bets bets_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: predictions predictions_triggerer_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_triggerer_id_fk FOREIGN KEY (triggerer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: predictions predictions_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: snooze_checks snooze_checks_prediction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.snooze_checks
    ADD CONSTRAINT snooze_checks_prediction_id_fkey FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;


--
-- Name: snooze_votes snooze_votes_snooze_check_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.snooze_votes
    ADD CONSTRAINT snooze_votes_snooze_check_id_fkey FOREIGN KEY (snooze_check_id) REFERENCES public.snooze_checks(id) ON DELETE CASCADE;


--
-- Name: snooze_votes snooze_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.snooze_votes
    ADD CONSTRAINT snooze_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: votes votes_prediction_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_prediction_id_fk FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE SET NULL;


--
-- Name: votes votes_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250507173754');
