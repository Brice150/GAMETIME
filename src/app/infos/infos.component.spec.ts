import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { ConsentService } from '../core/services/consent.service';
import { InfosComponent } from './infos.component';

describe('InfosComponent', () => {
  let params: BehaviorSubject<ParamMap>;
  let fixture: ComponentFixture<InfosComponent>;

  async function build(
    infoType: string | null,
    adsRequired = false,
    usesGoogleCmp = false,
  ) {
    params = new BehaviorSubject(
      convertToParamMap(infoType === null ? {} : { infoType }),
    );

    TestBed.configureTestingModule({
      imports: [InfosComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        {
          provide: ConsentService,
          useValue: {
            required: adsRequired,
            usesGoogleCmp,
            openPreferences: () => undefined,
          },
        },
      ],
    });

    TestBed.inject(Title).setTitle('Game Time');
    fixture = TestBed.createComponent(InfosComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => TestBed.resetTestingModule());

  it.each([
    ['mentions-legales', 'app-mentions-legales', 'Mentions légales'],
    ['cgu', 'app-cgu', 'Conditions générales d’utilisation'],
    ['confidentialite', 'app-privacy', 'Politique de confidentialité'],
    ['cookies', 'app-cookies', 'Cookies et traceurs'],
  ])('affiche le document %s', async (key, selector, title) => {
    const element = await build(key);

    expect(element.querySelector(selector)).toBeTruthy();
    expect(element.querySelector('h1')!.textContent).toBe(title);
    expect(TestBed.inject(Title).getTitle()).toBe(`${title} | Game Time`);
  });

  it('affiche les mentions legales pour une adresse inconnue', async () => {
    const element = await build('inconnu');

    expect(element.querySelector('app-mentions-legales')).toBeTruthy();
  });

  it('affiche les mentions legales sans parametre', async () => {
    const element = await build(null);

    expect(element.querySelector('app-mentions-legales')).toBeTruthy();
  });

  it('propose les trois autres documents', async () => {
    await build('cgu');

    expect(
      fixture.componentInstance.others().map((document) => document.key),
    ).toEqual(['mentions-legales', 'confidentialite', 'cookies']);
  });

  it('suit le changement de document', async () => {
    const element = await build('cgu');

    params.next(convertToParamMap({ infoType: 'cookies' }));
    await fixture.whenStable();

    expect(element.querySelector('app-cookies')).toBeTruthy();
  });

  it('rend le titre de l onglet en partant', async () => {
    await build('cgu');

    fixture.destroy();

    expect(TestBed.inject(Title).getTitle()).toBe('Game Time');
  });

  it('decrit la publicite quand elle est active', async () => {
    const privacy = await build('confidentialite', true);
    expect(privacy.textContent).toContain('Google AdSense');
    TestBed.resetTestingModule();

    const cookies = await build('cookies', true);
    expect(cookies.textContent).toContain('__gads');
    expect(cookies.querySelector('button.link')).toBeTruthy();
  });

  it('precise ce que change un refus selon la CMP', async () => {
    const google = await build('cookies', true, true);
    expect(google.textContent).toContain('certifié selon le standard européen');
    TestBed.resetTestingModule();

    const internal = await build('cookies', true, false);
    expect(internal.textContent).toContain('aucun script publicitaire');
  });

  it('dit qu il n y a aucune publicite sinon', async () => {
    const cookies = await build('cookies');

    expect(cookies.textContent).toContain('aucune publicité');
    expect(cookies.textContent).not.toContain('__gads');
  });
});
