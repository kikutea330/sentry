"""
sentry.runner.commands.createuser
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

:copyright: (c) 2015 by the Sentry Team, see AUTHORS for more details.
:license: BSD, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import click
from sentry.runner.decorators import configuration


def _get_field(field_name):
    from sentry.models import User
    return User._meta.get_field(field_name)


def _get_email():
    from django.core.exceptions import ValidationError
    rv = click.prompt('Email')
    field = _get_field('email')
    try:
        return field.clean(rv, None)
    except ValidationError as e:
        raise click.ClickException('; '.join(e.messages))


def _get_password():
    from django.core.exceptions import ValidationError
    rv = click.prompt('Password', hide_input=True, confirmation_prompt=True)
    field = _get_field('password')
    try:
        return field.clean(rv, None)
    except ValidationError as e:
        raise click.ClickException('; '.join(e.messages))


def _get_superuser():
    return click.confirm('Should this user be a superuser?', default=False)


@click.command()
@click.option('--email')
@click.option('--password')
@click.option('--superuser/--no-superuser', default=None, is_flag=True)
@click.option('--no-password', default=False, is_flag=True)
@click.option('--no-input', default=False, is_flag=True)
@configuration
def createuser(email, password, superuser, no_password, no_input):
    "Create a new user."
    if not no_input:
        if not email:
            email = _get_email()

        if not (password or no_password):
            password = _get_password()
            click.echo(password)

        if superuser is None:
            superuser = _get_superuser()

    if not email:
        raise click.ClickException('Invalid or missing email address.')

    if not no_password and not password:
        raise click.ClickException('No password set and --no-password not passed.')

    from sentry import roles
    from sentry.models import Organization, OrganizationMember, User
    from django.conf import settings

    user = User(
        email=email,
        username=email,
        is_superuser=superuser,
        is_staff=superuser,
        is_active=True,
    )

    if password:
        user.set_password(password)

    user.save()

    click.echo('User created: %s' % (email,))

    # TODO(dcramer): kill this when we improve flows
    if settings.SENTRY_SINGLE_ORGANIZATION:
        org = Organization.get_default()
        OrganizationMember.objects.create(
            organization=org,
            user=user,
            role=roles.get_top_dog().id,
        )
        click.echo('Added to organization: %s' % (org.slug,))