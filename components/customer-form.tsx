/**
 * TEMPORARY SHIM – will be removed once all code paths migrate to `OrganizationForm`.
 *
 * Re-exports `OrganizationForm` under the old name `CustomerForm` so existing
 * imports do not break during the transition from “Customer(s)” to
 * “Organization(s)”.
 */

export { OrganizationForm as CustomerForm } from "./organization-form"
